const redisHelper = require('../redis-helper');

const adminHandler = function(redisCilent, socket, action){
    console.log(action.type);
    if(action.type == 'IO:ADMIN_GET_TEAMS'){
        redisHelper.getTeams(redisCilent, (reply)=>{
            let teams = {};
            let totalTeams = 0;
            if(reply.length == 0){
                socket.emit('action', {type: 'ADMIN_RETURN_TEAMS', data: {}});
                return;
            }
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
                data[action.payload.id].score = 0;
                socket.emit('action', {type: 'ADMIN_TEAM_NEW', data: data});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_TEAM_NEW', data: data});
            }
        });
    }else if(action.type == 'IO:ADMIN_REMOVE_TEAM'){
        redisHelper.removeTeam(redisCilent, action.payload.id, (reply)=>{
            if(reply){
                socket.emit('action', {type: 'ADMIN_TEAM_REMOVED', id: action.payload.id});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_TEAM_REMOVED', id: action.payload.id});
            }
        });
    }else if(action.type == 'IO:ADMIN_CONFIRM_SCORE_CHANGE'){
        redisHelper.updateTeamScore(redisCilent, action.payload.id, action.payload.score, (reply)=>{
            if(reply == 0){
                socket.emit('action', {type: 'ADMIN_CHANGE_SCORE', payload: {id: action.payload.id, score: action.payload.score}});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_CHANGE_SCORE', payload: {id: action.payload.id, score: action.payload.score}});
            }
        });
    }else if(action.type == 'IO:ADMIN_GET_TEAM_LIST'){
        redisHelper.getTeamsList(redisCilent, (reply)=>{
            if(reply){
                socket.emit('action', {type: 'ADMIN_RETURN_TEAM_LIST', payload: reply});
            }
        });
    }else if(action.type == 'IO:ADMIN_GET_PLAYERS'){
        redisHelper.getPlayersFromTeam(redisCilent, action.payload.id, (reply)=>{
            if(reply){
                socket.emit('action', {type: 'ADMIN_RETURN_PLAYERS', payload: reply});
            }
        });
    }
}

module.exports = adminHandler;
