const nanoid = require('nanoid');

const redisHelper = require('../redis-helper');

const loginHandler = function(redisClient, socket, action){
    if(action.type === 'IO:GAME_LOGIN'){
        redisHelper.getAuthMode(redisClient, (mode)=>{
            if(mode === 'off'){
                if(action.payload){
                    redisHelper.playerExtist(redisClient, action.payload.username, (exists)=>{
                        if(exists){
                            let sessionId = nanoid();
                            redisHelper.newSession(redisClient, sessionId, action.payload.username, (reply)=>{
                                if(reply){
                                    redisHelper.getPlayerRole(redisClient, action.payload.username, (role)=>{
                                        socket.emit('action', {type: 'GAME_LOGIN_SUCCESS', payload: {sessionId: sessionId, role: role.toLowerCase()}} );
                                    });
                                }
                            });
                        }else{
                            socket.emit('action', {type: 'GAME_LOGIN_FAIL', payload: {error: "找不到玩家"}});
                        }
                    });
                }
            }else{
                redisHelper.removeWhitelist(redisClient, action.payload.username, (reply)=>{
                    if(reply === 1){ // Player on wishlist
                        let sessionId = nanoid();
                        redisHelper.newSession(redisClient, sessionId, action.payload.username, (reply)=>{
                            if(reply){
                                redisHelper.getPlayerRole(redisClient, action.payload.username, (role)=>{
                                    socket.emit('action', {type: 'GAME_LOGIN_SUCCESS', payload: {sessionId: sessionId, role: role.toLowerCase()}} );
                                });
                            }
                        });
                    }else{
                        redisHelper.playerExtist(redisClient, action.payload.username, (exists)=>{
                            if(exists){
                                let pendingId = nanoid();
                                let timestemp = new Date().getTime() + 300000;

                                let details = {
                                    pendingId: pendingId,
                                    playerId: action.payload.username,
                                    expireAt: timestemp,
                                    socketId: socket.id
                                };

                                redisHelper.createPendingPlayer(redisClient, pendingId, details, timestemp, (reply)=>{
                                    if(reply){
                                        socket.emit('action', {type: 'GAME_LOGIN_PENDING', payload: { pendingId: pendingId, expireAt: timestemp }} );
                                    }
                                });
                            }else{
                                socket.emit('action', {type: 'GAME_LOGIN_FAIL', payload: {error: "找不到玩家"}});
                            }
                        });
                    }
                })
            }
        });
    }else if(action.type === 'IO:GAME_UPDATE_SCOKET'){
        redisHelper.setPendingSocketId(redisClient, action.payload.pendingId, socket.id, (reply)=>{
        });
    }
}

module.exports = loginHandler;
