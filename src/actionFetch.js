const redisHelper = require('./redis-helper');

const adminHandler = require('./actionHandler/adminHandler');

const fetchAction = function(redisCilent, socket, action){
    //console.log(action.type);
    redisHelper.getPlayerRole(redisCilent, socket.request.user, (role)=>{
        role = 'ADMIN'; // Temp line
        if(!role) return;
        if(action.type.startsWith('IO:ADMIN_') && role == 'ADMIN'){
            // isAdmin
            adminHandler(redisCilent, socket, action);
        }
        if(action.type.startsWith('IO:LEADER_') && role == 'LEADER'){
            // isLeader
        }
    });
}

module.exports = fetchAction;
