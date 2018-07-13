const redisHelper = require('../redis-helper');
const _ = require('lodash/core');

const Mission = require('../missions/mission');

const adminHandler = function(redisClient, socket, action){
    console.log(action.type);
    if(action.type == 'IO:ADMIN_GET_TEAMS'){
        redisHelper.getTeams(redisClient, (reply)=>{
            let teams = {};
            let totalTeams = 0;
            if(reply.length == 0){
                socket.emit('action', {type: 'ADMIN_RETURN_TEAMS', data: {}});
                return;
            }
            for(let i=0; i<reply.length; i++){
                if(i%2 == 0){
                    let team = reply[i];
                    redisHelper.getTeamDetails(redisClient, team, (re)=>{
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
        redisHelper.addTeam(redisClient, action.payload.id, action.payload.teamData, (reply)=>{
            if(reply){
                let data = {};
                data[action.payload.id] = action.payload.teamData;
                data[action.payload.id].score = 0;
                socket.emit('action', {type: 'ADMIN_TEAM_NEW', data: data});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_TEAM_NEW', data: data});
            }
        });
    }else if(action.type == 'IO:ADMIN_REMOVE_TEAM'){
        redisHelper.removeTeam(redisClient, action.payload.id, (reply)=>{
            if(reply){
                socket.emit('action', {type: 'ADMIN_TEAM_REMOVED', id: action.payload.id});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_TEAM_REMOVED', id: action.payload.id});
            }
        });
    }else if(action.type == 'IO:ADMIN_CONFIRM_SCORE_CHANGE'){
        redisHelper.updateTeamScore(redisClient, action.payload.id, action.payload.score, (reply)=>{
            if(reply == 0){
                socket.emit('action', {type: 'ADMIN_CHANGE_SCORE', payload: {id: action.payload.id, score: action.payload.score}});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_CHANGE_SCORE', payload: {id: action.payload.id, score: action.payload.score}});
                socket.to(action.payload.id).emit('action', {type: 'GAME_RETURN_SCORE', payload: {score: action.payload.score}});
            }
        });
    }else if(action.type == 'IO:ADMIN_GET_TEAM_LIST'){
        redisHelper.getTeamsList(redisClient, (reply)=>{
            if(reply){
                socket.emit('action', {type: 'ADMIN_RETURN_TEAM_LIST', payload: reply});
            }
        });
    }else if(action.type == 'IO:ADMIN_GET_PLAYERS'){
        redisHelper.getPlayersFromTeam(redisClient, action.payload.id, (reply)=>{
            if(reply){
                let players = {};
                let totalPlayers = 0;
                if(reply.length == 0){
                    socket.emit('action', {type: 'ADMIN_RETURN_PLAYERS', payload: {}});
                    return;
                }
                for(let i=0; i<reply.length; i++){
                    let player = reply[i];
                    redisHelper.getPlayerDetails(redisClient, player, (re)=>{
                        players[player] = re;
                        totalPlayers++;
                        if(totalPlayers >= reply.length){
                            socket.emit('action', {type: 'ADMIN_RETURN_PLAYERS', payload: players});
                        }
                    });
                }
            }
        });
    }else if(action.type == 'IO:ADMIN_ADD_PLAYER'){
        redisHelper.addPlayer(redisClient, action.payload.id, action.payload.data, (reply)=>{
            if(reply){
                let data = {};
                data[action.payload.id] = action.payload.data;
                socket.emit('action', {type: 'ADMIN_PLAYER_NEW', payload: data});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_PLAYER_NEW', payload: data});
            }
        });
    }else if(action.type == 'IO:ADMIN_REMOVE_PLAYER'){
        redisHelper.removePlayer(redisClient, action.payload.id, action.payload.data, (reply)=>{
            if(reply){
                socket.emit('action', {type: 'ADMIN_PLAYER_REMOVED', id: action.payload.id});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_PLAYER_REMOVED', id: action.payload.id});
            }
        })
    }
    else if(action.type == 'IO:ADMIN_GET_TASKS'){
        redisHelper.getTasks(redisClient, (reply)=>{
            let stage = reply.stage;
            let tasks = reply.tasks;
            if(tasks){
                let processedTask = {};
                let totalTasks = _.size(tasks);
                _.forEach(tasks, (task, id)=>{
                    console.log(task);
                    if(stage === 'NONE' || task.taskId === '-1'){
                        let t = {
                            display: {
                                title: "請等候接收指令",
                                description: ""
                            },
                            type: 'END',
                            taskId: task.taskId
                        };
                        processedTask[id] = t;
                        totalTasks--;
                    }else{
                        let objectives = Mission[stage];
                        let t = {
                            display: Mission[stage].objectives[task.taskId][task.currentObjective].display,
                            taskId: task.taskId,
                            type: Mission[stage].objectives[task.taskId][task.currentObjective].type
                        }
                        processedTask[id] = t;
                        totalTasks--;
                    }
                });

                if(totalTasks === 0){
                    let mis;
                    if(!Mission[stage]){
                        mis = [];
                    }else{
                        mis = _.keys(Mission[stage].objectives);
                    }
                    socket.emit('action', {type: 'ADMIN_RETURN_TASKS', payload: {tasks: processedTask, tasksList: mis}});
                }
            }
        });
    }else if(action.type == 'IO:ADMIN_GET_STAGES'){
        redisHelper.getStage(redisClient, (reply)=>{
            console.log(reply);
            if(reply){
                let stages = _.keys(Mission);
                socket.emit('action', {type: 'ADMIN_RETURN_STAGES', payload: {currentStage: reply, stages: stages}});
            }
        });
    }else if(action.type == 'IO:ADMIN_UPDATE_STAGES'){
        redisHelper.setStage(redisClient, action.payload, (reply)=>{
            if(reply){
                redisHelper.resetTasks(redisClient, (rep)=>{
                    let processedTask = {};
                    let totalTasks = _.size(rep.tasks);
                    let t = {
                        display: {
                            title: "請等候接收指令",
                            description: ""
                        },
                        type: 'END',
                        taskId: '-1'
                    };
                    _.forEach(rep.tasks, (task, id)=>{
                            processedTask[id] = t;
                    });
                    let mis;
                    if(!Mission[action.payload]){
                        mis = [];
                    }else{
                        mis = _.keys(Mission[action.payload].objectives);
                    }
                    socket.emit('action', {type: 'ADMIN_RETURN_TASKS', payload: {currentStage: action.payload, tasks: processedTask, tasksList: mis}} );
                    socket.to('ADMIN').emit('action', {type: 'ADMIN_RETURN_TASKS', payload: {currentStage: action.payload, tasks: processedTask, tasksList: mis}} );
                    socket.broadcast.emit('action', {type: 'GAME_RETURN_TASK', payload: { task: t }} );
                })
            }
        });
    }else if(action.type == 'IO:ADMIN_SET_TASK'){
        redisHelper.setTask(redisClient, action.payload.teamId, action.payload.taskId, (reply)=>{
            if(reply){
                redisHelper.getStage(redisClient, (reply)=>{
                    let task = {
                        display: Mission[reply].objectives[action.payload.taskId][0].display,
                        taskId: action.payload.taskId,
                        type: Mission[reply].objectives[action.payload.taskId][0].type
                    }
                    socket.emit('action', {type: 'ADMIN_UPDATE_TASK', payload: {teamId: action.payload.teamId, task: task } } );
                    socket.to('ADMIN').emit('action', {type: 'ADMIN_UPDATE_TASK', payload: {teamId: action.payload.teamId, task: task } } );
                    socket.to(action.payload.teamId).emit('action', {type: 'GAME_RETURN_TASK', payload: { task: task } } );
                });
            }
        })
    }else if(action.type == 'IO:ADMIN_SKIP_TASK'){
        redisHelper.nextTask(redisClient, action.payload.teamId, (reply)=>{
            if(reply){
                redisHelper.getStage(redisClient, (stage)=>{
                    let task = {
                        display: Mission[stage].objectives[reply.taskId][reply.currentObjective].display,
                        taskId: reply.taskId,
                        type: Mission[stage].objectives[reply.taskId][reply.currentObjective].type
                    }
                    socket.emit('action', {type: 'ADMIN_UPDATE_TASK', payload: {teamId: action.payload.teamId, task: task } } );
                    socket.to('ADMIN').emit('action', {type: 'ADMIN_UPDATE_TASK', payload: {teamId: action.payload.teamId, task: task } } );
                    socket.to(action.payload.teamId).emit('action', {type: 'GAME_RETURN_TASK', payload: { task: task } } );
                });
            }
        })

    }else if(action.type == 'IO:ADMIN_FINISH_TASK'){
        redisHelper.nextTask(redisClient, action.payload.teamId, (reply)=>{
            if(reply){
                redisHelper.getStage(redisClient, (stage)=>{
                    let score = Mission[stage].objectives[reply.taskId][reply.currentObjective - 1].score || 0;

                    redisHelper.addTeamScore(redisClient, action.payload.teamId, score, (rep)=>{
                        socket.to('ADMIN').emit('action', {type: 'ADMIN_CHANGE_SCORE', payload: {id: action.payload.teamId, score: rep}});
                        socket.to(action.payload.teamId).emit('action', {type: 'GAME_RETURN_SCORE', payload: { score: rep } } );
                    });

                    let task = {
                        display: Mission[stage].objectives[reply.taskId][reply.currentObjective].display,
                        taskId: reply.taskId,
                        type: Mission[stage].objectives[reply.taskId][reply.currentObjective].type
                    }
                    socket.emit('action', {type: 'ADMIN_UPDATE_TASK', payload: {teamId: action.payload.teamId, task: task } } );
                    socket.to('ADMIN').emit('action', {type: 'ADMIN_UPDATE_TASK', payload: {teamId: action.payload.teamId, task: task } } );
                    socket.to(action.payload.teamId).emit('action', {type: 'GAME_RETURN_TASK', payload: { task: task } } );
                });

            }
        })
    }else if(action.type == 'IO:ADMIN_GET_AUTH_MODE'){
        redisHelper.getAuthMode(redisClient, (reply)=>{
            if(reply){
                socket.emit('action', {type: 'ADMIN_RETURN_AUTH_MODE', payload: reply});
            }
        });
    }else if(action.type == 'IO:ADMIN_SET_AUTH_MODE'){
        redisHelper.setAuthMode(redisClient, action.payload, (reply)=>{
            if(reply){
                socket.emit('action', {type: 'ADMIN_RETURN_AUTH_MODE', payload: action.payload});
                socket.to('ADMIN').emit('action', {type: 'ADMIN_RETURN_AUTH_MODE', payload: action.payload});
            }
        });
    }
}

module.exports = adminHandler;
