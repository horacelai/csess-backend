const redisHelper = require('../redis-helper');
const Mission = require('../missions/mission');

const leaderHandler = function(redisCilent, socket, action){
    if(action.type == 'IO:LEADER_FINISH_TASK'){
        redisHelper.getPlayerTeam(redisCilent, socket.request.user, (team)=>{
            if(team){
                redisHelper.getTask(redisCilent, team, (t)=>{
                    let stage = t.stage;
                    let task = t.task;
                    let objective = Mission[stage].objectives[task.taskId][task.currentObjective];
                    if(objective.type === 'ANSWER' || objective.type === 'LEADER'){
                        redisHelper.setTeamLock(redisCilent, team, (rep)=>{
                            if(rep == 1){
                                redisHelper.nextTask(redisCilent, team, (reply)=>{
                                    let score = objective.score || 0;

                                    redisHelper.addTeamScore(redisCilent, team, score, (s)=>{
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
                    }
                });
            }
        });
    }
}

module.exports = leaderHandler;
