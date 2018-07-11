const redisHelper = require('../redis-helper');
const Mission = require('../missions/mission');

const gameHandler = function(redisCilent, socket, action){
    if(action.type == 'IO:GAME_GET_SCORE'){
        redisHelper.getPlayerTeam(redisCilent, socket.request.user, (team)=>{
            if(team){
                redisHelper.getTeamScore(redisCilent, team, (score)=>{
                    socket.emit('action', {type: 'GAME_RETURN_SCORE', payload: {score: score}} );
                });
            }
        });
    }else if(action.type == 'IO:GAME_GET_SCORES'){
        redisHelper.getTeams(redisCilent, (reply)=>{
            let scores = [];
            let total = 0;
            for(let i=0; i<reply.length; i+=2){
                redisHelper.getTeamDetails(redisCilent, reply[i], (rep)=>{
                    scores[i/2] = {team: rep , score: reply[i+1]};
                    total++;
                    if(total >= (reply.length / 2)){
                        socket.emit('action', {type: 'GAME_RETURN_SCORES', payload: {scores: scores}} );
                    }
                });
            }
        });

    }else if(action.type == 'IO:GAME_GET_TASK'){
        redisHelper.getPlayerTeam(redisCilent, socket.request.user, (team)=>{
            if(team){
                redisHelper.getTask(redisCilent, team, (reply)=>{
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

    }
}

module.exports = gameHandler;
