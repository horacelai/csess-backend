const redisHelper = require('./src/redis-helper');

const redis = require("redis");
const client = redis.createClient({});

let playerid = 'admin';


redisHelper.addTeam(client, 'ADMIN', {
    name: 'admin',
    color: '#FFFFFF'
}, (replies)=>{
    console.log('team admin created!');
});

redisHelper.addPlayer(client, playerid, {
    team: 'ADMIN',
    username: 'Powerful Admin',
    role: 'ADMIN'
}, (replies)=>{
    console.log('ADMIN created!');
});

redisHelper.getTeams(client, (reply)=>{
    console.log('teams:' + reply);
    client.quit();
});
