const redisHelper = require('./src/redis-helper');

const fetchAction = function(redisCilent, socket, action){
    console.log(action.type);

    redisHelper.getPlayerRole(redisCilent, socket.query.playerId, (reply)=>{
        if(action.type.startsWith('ADMIN_') && reply == 'ADMIN'){
            // isAdmin
        }
        if(action.type.startsWith('LEADER_') && reply == 'LEADER'){
            // isLeader
        }
    });
}

export default fetchAction;
