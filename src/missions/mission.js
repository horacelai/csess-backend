class Mission{
    constructor(name, description){
        this.name = name;
        this.description = description;
        this.objectiveSets = [];
    }

    addObjectives(objective){
        this.objectiveSets.push(objective);
    }
}

module.exports = Mission;
