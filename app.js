var options = {
	key: fs.readFileSync('/etc/letsencrypt/live/chronicles.site/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/chronicles.site/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/chronicles.site/chain.pem')
};

const app = require('https').createServer();
const io = require('socket.io')(app);

const redis = require("redis");
const client = redis.createClient({});
const PubSubClient = redis.createClient({});
const redisAdapter = require('socket.io-redis');

const fetchAction = require('./src/actionFetch');
const redisHelper = require('./src/redis-helper');

app.listen(4000);

io.origins(['*:*']);
io.adapter(redisAdapter({ pupClient: PubSubClient, subClient: PubSubClient }));


client.on("error", function (err) {
  console.log("Error: " + err);
});

console.log("Listening on host 8080");


io.use((socket, next) => {
    const sessionid = socket.handshake.query.sessionId;
    redisHelper.checkSession(client, sessionid, (reply) => {
        if(reply){
            socket.request.user = reply;
            return next();
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
