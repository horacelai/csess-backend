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
                            })
                        }else{
                            socket.emit('action', {type: 'GAME_LOGIN_FAIL', payload: {error: "找不到玩家"}});
                        }
                    });
                }
            }
        });
    }
}

module.exports = loginHandler;
