const redisHelper = require('./redis-helper');

const adminHandler = require('./actionHandler/adminHandler');

const fetchAction = function(redisCilent, socket, action){
    //console.log(action.type);
    redisHelper.getPlayerRole(redisCilent, socket.request.user, (reply)=>{
        reply = 'ADMIN'; // Temp line
        if(!reply) return;
        if(action.type.startsWith('IO:ADMIN_') && reply == 'ADMIN'){
            // isAdmin
            adminHandler(redisCilent, socket, action);
        }
        if(action.type.startsWith('IO:LEADER_') && reply == 'LEADER'){
            // isLeader
        }
    });
}

module.exports = fetchAction;
