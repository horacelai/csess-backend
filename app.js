const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const redis = require("redis");
const client = redis.createClient({});
const PubSubClient = redis.createClient({});
const redisAdapter = require('socket.io-redis');

const fetchAction = require('./src/actionFetch');
const redisHelper = require('./src/redis-helper');

io.origins(['*:*']);
io.adapter(redisAdapter({ pupClient: PubSubClient, subClient: PubSubClient }));

server.listen(8080);

client.on("error", function (err) {
  console.log("Error: " + err);
});

console.log("Listening on host 8080");

app.get('/', function (req, res) {
    redisHelper.addPlayer(client, '123456', {team: '1'}, (reply) => {
        res.send(reply);
    });
});
app.post('/login', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.use((socket, next) => {
    const sessionid = socket.handshake.query.sessionId;
    redisHelper.checkSession(client, sessionid, (reply) => {
        reply = 'admin'; //temp line
        if(reply){
            socket.request.user = reply;
            return next();
        }
        return next();
    });
    return next(new Error(''));
});

io.on('connection', (socket) => {
    if(socket.request.user){
        redisHelper.getPlayerRole(client, socket.request.user, (reply)=>{
            if(reply){
                socket.join(reply);
            }
        });
    }

    socket.on('action', (data) => {
        fetchAction(client, socket, data);
    });
});
