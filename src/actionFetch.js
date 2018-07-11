const redisHelper = require('./redis-helper');

const adminHandler = require('./actionHandler/adminHandler');
const gameHandler = require('./actionHandler/gameHandler');

const fetchAction = function(redisCilent, socket, action){
    if(socket.request.user){
        redisHelper.getPlayerRole(redisCilent, socket.request.user, (role)=>{
            if(!role) return;
            if(action.type.startsWith('IO:ADMIN_') && role == 'ADMIN'){
                // isAdmin
                adminHandler(redisCilent, socket, action);
            }
            if(action.type.startsWith('IO:LEADER_') && role == 'LEADER'){
                // isLeader
            }

            gameHandler(redisCilent, socket, action);
        });
    }else{
        // Login thing
    }

}

module.exports = fetchAction;
