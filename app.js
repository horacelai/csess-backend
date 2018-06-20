const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const redis = require("redis");
const client = redis.createClient({});
const PubSubClient = redis.createClient({});
const redisAdapter = require('socket.io-redis');

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

io.on('connection', (socket) => {
  socket.use((packet, next) => {
      const sessionid = packet.handshake.query.sessionId;
      redisHelper.checkSession(client, sessionid, (reply) => {
          if(reply){
              packet.handshake.query.playerId = reply;
              return next();
          }
          next(new Error('Authencation error!'));
      });
      next(new Error(''));
  });

  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
