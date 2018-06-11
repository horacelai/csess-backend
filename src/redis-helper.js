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

exports.addPlayer = function(client, playerId, playerDetail, callback){
    client.multi().HMSET('player:' + playerId, playerDetail).
        sadd('team:' + playerDetail.team + ':list', playerId).
        sadd('players', playerId).exec((err, replies) => {
            callback(replies);
    });
}

exports.addTeams = function(client, teamId, teamDetail, callback){
    client.multi().HMSET('team:' + teamId, teamDetail).
        zadd('teams:', teamId, 'NX', 0).
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

exports.setAdmin = function(client, playerId, callback){
    client.sadd('admins', playerId, (err, replies) => {
        callback(replies);
    });
}

exports.isAdmin = function(client, playerId, callback){
    client.sismember('admins', playerId, (err, reply) => {
        callback(reply);
    });
}

exports.removeAdmin = function(client, playerId, callback){
    client.srem('admins', playerId, (err, reply) => {
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
