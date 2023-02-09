const { db } = require('../database');
const ical = require('node-ical');
const cron = require('node-cron');
const { apiUrls } = require('../configs/apiUrls');

const oneDay = 8.64e7;

exports.updateEvents = async () => {
  const calendar = await ical.async.fromURL(apiUrls.events);
  const events = Object.values(calendar);

  const gacEvents = events.filter(event => event.categories.includes('GA'));
  if (gacEvents.length) await db.collection('events').deleteMany({});

  for (const event of gacEvents) {
    const season = event.summary.slice(7, 9);
    const week = event.summary.slice(22, 24);
    const type = event.summary.contains('5v5') ? '5v5' : '3v3';
    const title = `GAC Season ${season} (${type}) Week ${week}`;

    const phases = [];

    const startTimestamp = Date.parse(event.start);
    phases.push({
      name: `Event Join Phase`,
      season: title,
      start: startTimestamp,
      end: startTimestamp + oneDay,
    });
    phases.push({
      name: `Match 1 - Defense Phase`,
      season: title,
      start: startTimestamp + oneDay,
      end: startTimestamp + 2 * oneDay,
    });
    phases.push({
      name: `Match 1 - Attack Phase`,
      season: title,
      start: startTimestamp + 2 * oneDay,
      end: startTimestamp + 3 * oneDay,
    });
    phases.push({
      name: `Match 2 - Defense Phase`,
      season: title,
      start: startTimestamp + 3 * oneDay,
      end: startTimestamp + 4 * oneDay,
    });
    phases.push({
      name: `Match 2 - Attack Phase`,
      season: title,
      start: startTimestamp + 4 * oneDay,
      end: startTimestamp + 5 * oneDay,
    });
    phases.push({
      name: `Match 3 - Attack Phase`,
      season: title,
      start: startTimestamp + 5 * oneDay,
      end: startTimestamp + 6 * oneDay,
    });
    phases.push({
      name: `Match 3 - Defense Phase`,
      season: title,
      start: startTimestamp + 6 * oneDay,
      end: startTimestamp + 7 * oneDay,
    });

    await db.collection('events').insertMany(phases);
  }
};

cron.schedule(
  '1 */6 * * *', // Runs once every 6 hours
  () => {
    exports.updateEvents();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
