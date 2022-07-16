const ical = require('node-ical');
const { db } = require('../database');

exports.updateGameEvents = async () => {
  db.collection('warphases').deleteMany();

  const eventsCalendar = await ical.async.fromURL('https://swgohevents.com/ical');
  const events = Array.from(Object.values(eventsCalendar));

  const warEvents = events.filter(event => event.categories?.includes('TW'));
  for (const war of warEvents) {
    const defensePhaseStart = Date.parse(war.start) + 3.6e7;
    const defensePhaseEnd = defensePhaseStart + 8.64e7;
    const attackPhaseEnd = defensePhaseEnd + 8.64e7;

    db.collection('warphases').insertMany([
      {
        event: war.summary,
        eventStart: defensePhaseStart,
        name: 'Defense Phase',
        type: 'defense',
        start: defensePhaseStart,
        end: defensePhaseEnd,
      },
      {
        event: war.summary,
        eventStart: defensePhaseStart,
        name: 'Attack Phase',
        type: 'attack',
        start: defensePhaseEnd,
        end: attackPhaseEnd,
      },
    ]);
  }
};
