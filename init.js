const redisHelper = require('./src/redis-helper');

const redis = require("redis");
const client = redis.createClient({});

client.flushall(()=>{
    console.log('Deleted all key!');
});

let playerid = 'admin';

redisHelper.addHiddenTeam(client, 'ADMIN', {
    name: 'admin',
    color: '#FFFFFF'
}, (replies)=>{
    console.log('team admin created!');
}, true);

redisHelper.addPlayer(client, playerid, {
    team: 'ADMIN',
    username: 'Powerful Admin',
    role: 'ADMIN'
}, (replies)=>{
    console.log('ADMIN created!');
});

redisHelper.getTeams(client, (reply)=>{
    console.log('teams:' + reply);
});

redisHelper.getPlayers(client, (reply)=>{
    console.log('players:' + reply);
});

redisHelper.setStage(client, 'NONE', (reply)=>{
    console.log('Stage set to NONE.');

});

redisHelper.setAuthMode(client, 'OFF', (reply)=>{
    console.log('Set auth mode to NONE.');
    client.quit();
});
