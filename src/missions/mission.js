const Mission = {
    'NONE': {},
    'CITY_HUNT': require('./cityHunt'),
    'SCHOOL_HUNT': require('./schoolHunt'),
    'EGG_HUNT': require('./eggHunt'),
    'END_GAME': require('./endGame')
}

module.exports = Mission;
