var https = require('https');
var fs = require('fs');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/chronicles.site/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/chronicles.site/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/chronicles.site/chain.pem', 'utf8');

const app = https.createServer({
    key: privateKey,
	cert: certificate,
	ca: ca
});

const io = require('socket.io')(app);

const redis = require("redis");
const client = redis.createClient({});
const PubSubClient = redis.createClient({});
const redisAdapter = require('socket.io-redis');
const sticky = require('sticky-session');

const fetchAction = require('./src/actionFetch');
const redisHelper = require('./src/redis-helper');

const port = 4001 + (process.env.NODE_APP_INSTANCE ? parseInt(process.env.NODE_APP_INSTANCE, 10): 0);

io.origins(['*:*']);
io.adapter(redisAdapter({ pupClient: PubSubClient, subClient: PubSubClient }));


client.on("error", function (err) {
  console.log("Error: " + err);
});

if (!sticky.listen(app, port)) {
  app.once('listening', function() {
    console.log("listening on port: " + port );
  });
} else {
    io.use((socket, next) => {
        const sessionid = socket.handshake.query.sessionId;
        redisHelper.checkSession(client, sessionid, (reply) => {
            if(reply){
                socket.request.user = reply;
                return next();
            }else if(sessionid && !reply){
                socket.emit('action', { type: 'GAME_LOGIN_FAIL', payload: {error: 'Login Fail' }});
            }
            return next();
        });
        return next(new Error(''));
    });

    io.on('connection', (socket) => {
        socket.on('action', (data) => {
            if(socket.request.user){
                redisHelper.getPlayerTeam(client, socket.request.user, (reply)=>{
                    if(reply){
                        socket.join(reply);
                    }
                });
            }

            fetchAction(client, socket, data);
        });
    });

}
