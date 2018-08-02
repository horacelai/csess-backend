const redisHelper = require('../redis-helper');
const Mission = require('../missions/mission');

function distance(lon1, lat1, lon2, lat2) {
  var R = 6371; // Radius of the earth in km
  var dLat = toRad(lat2-lat1);  // Javascript functions in radians
  var dLon = toRad(lon2-lon1);
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function toRad(num){
    return num * Math.PI / 180;
}

const gameHandler = function(redisClient, socket, action){
    if(action.type == 'IO:GAME_GET_SCORE'){
        redisHelper.getPlayerTeam(redisClient, socket.request.user, (team)=>{
            if(team){
                redisHelper.getTeamScore(redisClient, team, (score)=>{
                    socket.emit('action', {type: 'GAME_RETURN_SCORE', payload: {score: score}} );
                });
            }
        });
    }else if(action.type == 'IO:GAME_GET_SCORES'){
        redisHelper.getTeams(redisClient, (reply)=>{
            let scores = [];
            let total = 0;
            for(let i=0; i<reply.length; i+=2){
                redisHelper.getTeamDetails(redisClient, reply[i], (rep)=>{
                    scores[i/2] = {team: rep , score: reply[i+1]};
                    total++;
                    if(total >= (reply.length / 2)){
                        socket.emit('action', {type: 'GAME_RETURN_SCORES', payload: {scores: scores}} );
                    }
                });
            }
        });

    }else if(action.type == 'IO:GAME_GET_TASK'){
        redisHelper.getPlayerTeam(redisClient, socket.request.user, (team)=>{
            if(team){
                redisHelper.getTask(redisClient, team, (reply)=>{
                    let stage = reply.stage;
                    let task = reply.task;
                    if(stage === 'NONE' || task.taskId === '-1'){
                        let t = {
                            display: {
                                title: "請等候接收指令",
                                description: ""
                            },
                            type: 'END',
                            taskId: task.taskId
                        };

                        socket.emit('action', {type: 'GAME_RETURN_TASK', payload: {task: t}} );
                    }else{
                        let objective = Mission[stage].objectives[task.taskId][task.currentObjective];
                        let t = {
                            display: objective.display,
                            taskId: task.taskId,
                            type: objective.type
                        }

                        socket.emit('action', {type: 'GAME_RETURN_TASK', payload: {task: t}} );
                    }
                });
            }
        });
    }else if(action.type == 'IO:GAME_FINISH_TASK'){
        redisHelper.getPlayerTeam(redisClient, socket.request.user, (team)=>{
            if(team){
                redisHelper.getTask(redisClient, team, (t)=>{
                    let stage = t.stage;
                    let task = t.task;
                    let objective = Mission[stage].objectives[task.taskId][task.currentObjective];
                    let answer = action.payload.key;

                    if(objective.type === 'ANSWER'){
                        if(objective.answer === answer){
                            redisHelper.setTeamLock(redisClient, team, (rep)=>{
                                if(rep == 1){
                                    redisHelper.nextTask(redisClient, team, (reply)=>{
                                        let score = objective.score || 0;

                                        redisHelper.addTeamScore(redisClient, team, score, (s)=>{
                                            socket.to('ADMIN').emit('action', {type: 'ADMIN_CHANGE_SCORE', payload: {id: team, score: s}});
                                            socket.to(team).emit('action', {type: 'GAME_RETURN_SCORE', payload: { score: s } } );
                                            socket.emit('action', {type: 'GAME_RETURN_SCORE', payload: { score: s } } );
                                        });

                                        let tt = {
                                            display: Mission[stage].objectives[reply.taskId][reply.currentObjective].display,
                                            taskId: reply.taskId,
                                            type: Mission[stage].objectives[reply.taskId][reply.currentObjective].type
                                        }
                                        socket.to(team).emit('action', {type: 'GAME_RETURN_TASK', payload: {task: tt } } );
                                        socket.to('ADMIN').emit('action', {type: 'ADMIN_UPDATE_TASK', payload: {teamId: team, task: tt } } );
                                        socket.emit('action', {type: 'GAME_RETURN_TASK', payload: {task: tt } } );
                                    });
                                }else{
                                    socket.emit('action', {type: 'GAME_RECIEVE_ERROR', payload: {error: "請稍候"}} );
                                }
                            });
                        }else{
                            socket.emit('action', {type: 'GAME_RECIEVE_ERROR', payload: {error: "答案不正確"}} );
                        }
                    }else if(objective.type === 'LOCATION'){
                        let dis = distance(answer.longitude, answer.latitude, objective.longitude, objective.latitude);
                        if(dis*1000 <= 50.0){
                            redisHelper.setTeamLock(redisClient, team, (rep)=>{
                                if(rep == 1){
                                    redisHelper.nextTask(redisClient, team, (reply)=>{
                                        let score = objective.score || 0;

                                        redisHelper.addTeamScore(redisClient, team, score, (s)=>{
                                            socket.to('ADMIN').emit('action', {type: 'ADMIN_CHANGE_SCORE', payload: {id: team, score: s}});
                                            socket.to(team).emit('action', {type: 'GAME_RETURN_SCORE', payload: { score: s } } );
                                            socket.emit('action', {type: 'GAME_RETURN_SCORE', payload: { score: s } } );
                                        });

                                        let tt = {
                                            display: Mission[stage].objectives[reply.taskId][reply.currentObjective].display,
                                            taskId: reply.taskId,
                                            type: Mission[stage].objectives[reply.taskId][reply.currentObjective].type
                                        }
                                        socket.to(team).emit('action', {type: 'GAME_RETURN_TASK', payload: {task: tt } } );
                                        socket.to('ADMIN').emit('action', {type: 'ADMIN_UPDATE_TASK', payload: {teamId: team, task: tt } } );
                                        socket.emit('action', {type: 'GAME_RETURN_TASK', payload: {task: tt } } );
                                    });
                                }else{
                                    socket.emit('action', {type: 'GAME_RECIEVE_ERROR', payload: {error: "請稍候"}} );
                                }
                            });
                        }else{
                            socket.emit('action', {type: 'GAME_RECIEVE_ERROR', payload: {error: "位置不正確，距離目標尚有 " + (dis*1000 - 50).toFixed(1) + " 米"}} );
                        }
                    }


                });
            }
        });
    }else if(action.type === 'IO:GAME_LOGOUT'){
        redisHelper.removeSession(redisClient, action.payload.sessionId, (reply)=>{
            socket.emit('action', {type: 'GAME_LOGOUT_SUCCESS'});
        });
    }
}

module.exports = gameHandler;
