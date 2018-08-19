const redisHelper = require('./redis-helper');

const adminHandler = require('./actionHandler/adminHandler');
const gameHandler = require('./actionHandler/gameHandler');
const leaderHandler = require('./actionHandler/leaderHandler');
const loginHandler = require('./actionHandler/loginHandler');

const fetchAction = function(redisCilent, socket, action){

    if(socket.request.user){
        redisHelper.getPlayerRole(redisCilent, socket.request.user, (role)=>{
            if(!role){
                socket.emit('action', { type: 'GAME_LOGIN_FAIL', payload: {error: 'Login Fail' }});
                return;
            };
            if(action.type.startsWith('IO:ADMIN_') && role == 'ADMIN'){
                // isAdmin
                adminHandler(redisCilent, socket, action);
            }
            if(action.type.startsWith('IO:LEADER_') && role == 'LEADER'){
                // isLeader
                leaderHandler(redisCilent, socket, action);
            }

            gameHandler(redisCilent, socket, action);
        });
    }else{
        // Login thing
        loginHandler(redisCilent, socket, action);
    }

}

module.exports = fetchAction;
