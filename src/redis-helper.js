exports.checkSession = function(client, sessionId, callback){
    client.hget('session:' + sessionId, 'playerId' , (err, reply) => {
        callback(reply);
    });
}

exports.newSession = function(client, sessionId, sessionDetail, callback){
    client.HMSET('session:' + sessionId, sessionDetail, (err, reply)=>{
        callback(reply);
    });
}

exports.playerExtist = function(cilent, playerId, callback){
    client.SISMEMBER('players', playerId, (err, reply)=>{
        callback(reply == 1);
    })
}

exports.addPlayer = function(client, playerId, playerDetail, callback){
    client.multi().HMSET('player:' + playerId, playerDetail).
        sadd('team:' + playerDetail.team + ':list', playerId).
        sadd('players', playerId).exec((err, replies) => {
            callback(replies);
    });
}

exports.addTeam = function(client, teamId, teamDetail, callback){
    client.multi().
        HMSET('team:' + teamId, teamDetail).
        ZADD('teams', 'NX', 0, teamId).
        exec((err, replies) => {
            callback(replies);
    });
}

exports.removeTeam = function(client, teamId, callback){
    client.multi().
        DEL('team:' + teamId).
        ZREM('teams', teamId).
        exec((err, replies) => {
            callback(replies);
    });
}

exports.getPlayers = function(client, callback){
    client.smembers('players', (err, reply)=>{
        callback(reply);
    });
}

exports.getPlayersFromTeam = function(client, teamId, callback){
    client.smembers('team:' + teamId + 'list', (err, reply)=>{
        callback(reply);
    });
}

exports.getPlayerDetails = function(client, playerId, callback){
    client.hgetall('player:' + playerId, (err, reply) => {
        callback(reply);
    });
}

exports.getPlayerRole = function(client, playerId, callback){
    client.hget('player:' + playerId, 'role', (err, reply) => {
        callback(reply);
    });
}

exports.setPlayerRole = function(client, playerId, role, callback){
    client.hget('player:' + playerId, 'role', role, (err, reply) => {
        callback(reply);
    });
}

exports.getTeams = function(client, callback){
    client.zrangebyscore('teams', '0', '+inf', (err, reply) =>{
        callback(reply);
    });
}

exports.getTeamScore = function(client, teamId, callback){
    client.zscore('teams', teamId, (err, reply) => {
        callback(reply);
    });
}

exports.getTeamDetails = function(client, teamId, callback){
    client.hgetall('team:' + teamId, (err, reply) => {
        callback(reply);
    });
}

exports.setStage = function(client, stage, callback){
    client.set('stage', stage, (err, replies) => {
        callback(replies);
    });
}

exports.getStage = function(client, callback){
    client.get('stage', (err, replies) => {
        callback(replies);
    });
}
