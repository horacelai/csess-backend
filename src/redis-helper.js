exports.checkSession = function(client, sessionId, callback){
    client.get('session:' + sessionId , (err, reply) => {
        callback(reply);
    });
}

exports.newSession = function(client, sessionId, userId, callback){
    client.set('session:' + sessionId, userId, (err, reply)=>{
        callback(reply);
    });
}

exports.removeSession = function(client, sessionId, callback){
    client.del('session:' + sessionId, (err, reply)=>{
        callback(reply);
    });
}

exports.playerExtist = function(client, playerId, callback){
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

exports.removePlayer = function(client, playerId, playerData, callback){
    client.multi().DEL('player:' + playerId).
        srem('team:' + playerData.team + ':list', playerId).
        srem('players', playerId).exec((err, replies) => {
            callback(replies);
    });
}

exports.addTeam = function(client, teamId, teamDetail, callback){
    client.multi().
        HMSET('team:' + teamId, teamDetail).
        HMSET('task:' + teamId, {currentObjective: 0, taskId: '-1'}).
        ZADD('teams', 'NX', '0', teamId).
        exec((err, replies) => {
            callback(replies);
    });
}

exports.addHiddenTeam = function(client, teamId, teamDetail, callback){
    client.multi().
        HMSET('team:' + teamId, teamDetail).
        ZADD('teams', 'NX', '-1', teamId).
        exec((err, replies) => {
            callback(replies);
    });
}

exports.removeTeam = function(client, teamId, callback){
    client.multi().
        DEL('team:' + teamId).
        DEL('task:' + teamId).
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
    client.smembers('team:' + teamId + ':list', (err, reply)=>{
        callback(reply);
    });
}

exports.deletePlayersWithoutTeam = function(client, callback){
    module.exports.getTeamsList(client, (teams)=>{
        teams = teams.map((team)=>{return ('team:' + team + ':list')});
        client.SDIFF('players', teams, (err, reply)=>{
            for(let i=0; i<reply.length; i++){
                module.exports.removePlayer(client, reply[i], '', ()=> { callback(reply) });
            };
        });
    })
}

exports.getPlayerDetails = function(client, playerId, callback){
    client.hgetall('player:' + playerId, (err, reply) => {
        callback(reply);
    });
}

exports.getPlayerTeam = function(client, playerId, callback){
    client.hget('player:' + playerId, 'team', (err, reply) => {
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
    client.zrevrangebyscore('teams', '+inf', '0', 'WITHSCORES', (err, reply) =>{
        callback(reply);
    });
}

exports.getTeamsList = function(client, callback){
    client.zrevrangebyscore('teams', '+inf', '-1', (err, reply) =>{
        callback(reply);
    });
}

exports.getTeamScore = function(client, teamId, callback){
    client.zscore('teams', teamId, (err, reply) => {
        callback(reply);
    });
}

exports.updateTeamScore = function(client, teamId, score, callback){
    client.ZADD('teams', 'XX', score, teamId, (err, reply)=>{
        callback(reply);
    });
}

exports.addTeamScore = function(client, teamId, score, callback){
    client.ZINCRBY('teams', score, teamId, (err, reply)=>{
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

exports.getTasks = function(client, callback){
    client.multi().zrangebyscore('teams', '0', '+inf').get('stage').exec((err, reply) => {
        let teams = reply[0];
        if(teams && teams.length > 0){
            let tasks = {};
            let taskCount = 0;
            for(let i=0; i<teams.length; i++){
                client.hgetall('task:' + teams[i], (err, task) => {
                    tasks[teams[i]] = task;
                    taskCount++;
                    if(taskCount == teams.length){
                        callback({stage: reply[1], tasks: tasks});
                    }
                });
            }
        }else if(teams.length === 0){
            callback({stage: reply[1], tasks: {}});
        }
    });
}

exports.getTask = function(client, teamId, callback){
    client.multi().get('stage')
    .hgetall('task:' + teamId).exec((err, reply) => {
        callback({stage: reply[0], task: reply[1]});
    });
}

exports.nextTask = function(client, teamId, callback){
    client.HINCRBY('task:' + teamId, 'currentObjective', 1, (err, replies) => {
        client.hgetall('task:' + teamId, (err, reply)=>{
            callback(reply);
        });
    });
}

exports.resetTasks = function(client, callback){
    client.zrangebyscore('teams', '0', '+inf', (err, teams)=>{
        if(teams){
            let tasks = {};
            let taskCount = 0;
            for(let i=0; i<teams.length; i++){
                client.hmset('task:' + teams[i], {currentObjective: 0, taskId: '-1'}, (err, reply) => {
                    tasks[teams[i]] = {currentObjective: 0, taskId: '-1'};
                    taskCount++;
                    if(taskCount == teams.length){
                        callback({tasks: tasks});
                    }
                });
            }
        }else if(teams.length === 0){
            callback({tasks: {}});
        }
    });
}

exports.setTask = function(client, teamId, taskId, callback){
    client.hmset('task:' + teamId, {currentObjective: 0, taskId: taskId}, (err, reply) => {
        callback(reply);
    });
}

exports.setAuthMode = function(client, mode, callback){
    client.set('auth', mode, (err, reply) => {
        callback(reply);
    });
}

exports.getAuthMode = function(client, callback){
    client.get('auth', (err, reply) => {
        callback(reply);
    });
}

exports.setTeamLock = function(client, team, callback){
    let date = new Date();
    let key = 'lock:' + team;
    client.multi().setnx(key, date.getTime()).
        expire(key, 5).exec((err, reply)=>{
            callback(reply[0]);
    });
}

exports.addWhitelist = function(client, player, callback){
    client.sadd('whitelist', player, (err, reply)=>{
        callback(reply);
    });
}

exports.removeWhitelist = function(client, player, callback){
    client.SREM('whitelist', player, (err, reply)=>{
        callback(reply);
    });
}

exports.createPendingPlayer = function(client, pendingId, details, expireTimestemp, callback){
    client.multi().HMSET('pending:' + pendingId, details).
        EXPIREAT('pending:' + pendingId, expireTimestemp).
        exec((err, reply)=>{
            if(reply[0]){
                callback(reply);
            }
        });
}

exports.getPendingPlayer = function(client, pendingId, callback){
    client.multi().hgetall('pending:' + pendingId).
        del('pending:' + pendingId).
        exec((err, reply)=>{
            if(reply[0]){
                callback(reply[0]);
            }
        });
}

exports.setPendingSocketId = function(client, pendingId, socketId, callback){
    client.HEXISTS('pending:' + pendingId, 'socketId', (err, exists)=>{
        if(exists === 1){
            client.HSET('pending:' + pendingId, 'socketId', socketId, (err, reply)=>{
                callback(reply);
            });
        }
    });
}

exports.addQRCode = function(client, id, score, callback){
    client.ZADD('UNCLAINED_QR', 'NX', score, id, (err, reply)=>{
        callback(reply);
    });
}

exports.getQRCode = function(client, id, callback){
    client.multi().ZSCORE('UNCLAINED_QR', id).
        ZREM('UNCLAINED_QR', id).
        exec((err, reply) => {
            callback(reply[0]);
        });
}

exports.getQRCodes = function(client, callback){
    client.zrevrangebyscore('UNCLAINED_QR', '+inf', '0', 'WITHSCORES', (err, reply) =>{
        callback(reply);
    });
}
