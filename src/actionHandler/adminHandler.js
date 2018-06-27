const redisHelper = require('../redis-helper');

const adminHandler = function(redisCilent, socket, action){
    console.log(action.type);
    if(action.type == 'IO:ADMIN_GET_TEAMS'){
        redisHelper.getTeams(redisCilent, (reply)=>{
            let teams = {};
            let totalTeams = 0;
            for(let i=0; i<reply.length; i++){
                if(i%2 == 0){
                    let team = reply[i];
                    redisHelper.getTeamDetails(redisCilent, team, (re)=>{
                        teams[team] = re;
                        teams[team].score = reply[i+1];
                        totalTeams++;
                        if(totalTeams >= reply.length / 2){
                            socket.emit('action', {type: 'ADMIN_RETURN_TEAMS', data: teams});
                        }
                    });
                }
            }
        });
    }else if(action.type == 'IO:ADMIN_ADD_TEAM'){
        redisHelper.addTeam(redisCilent, action.payload.id, action.payload.teamData, (reply)=>{
            if(reply){
                let data = {};
                data[action.payload.id] = action.payload.teamData;
                socket.emit('action', {type: 'ADMIN_TEAM_NEW', data: data});
                socket.broadcast.emit('action', {type: 'ADMIN_TEAM_NEW', data: data});
            }
        });
    }else if(action.type == 'IO:ADMIN_REMOVE_TEAM'){
        redisHelper.removeTeam(redisCilent, action.payload.id, (reply)=>{
            console.log(reply);
            if(reply){
                socket.emit('action', {type: 'ADMIN_TEAM_REMOVED', id: action.payload.id});
                socket.broadcast.emit('action', {type: 'ADMIN_TEAM_REMOVED', id: action.payload.id});
            }
        });
    }
}

module.exports = adminHandler;
