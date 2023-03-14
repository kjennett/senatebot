const { db } = require('../database');
const ical = require('node-ical');
const cron = require('node-cron');
const { apiUrls } = require('../configs/apiUrls');

/* ------------------ Event Update Task ----------------- */

exports.updateEvents = async () => {
  const calendar = await ical.async.fromURL(apiUrls.events);
  const events = Object.values(calendar);

  await db.collection('events').deleteMany({});

  for (const event of events) {
    if (!event.summary || !event.summary.includes('GA')) continue;

    const oneDay = 8.64e7;

    const season = event.summary.slice(7, 9);
    const week = event.summary.slice(23, 24);
    const type = event.summary.includes('5v5') ? '5v5' : '3v3';
    const title = `GAC Season ${season} (${type}) Week ${week}`;

    // Add 22 hours to 00:00 UTC timestamp to reach actual start times
    const startTimestamp = Date.parse(event.start) + 7.92e7;

    const phases = [];
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

/* ------------------- Task Scheduler ------------------- */

cron.schedule(
  '1 */3 * * *', // Runs once every 3 hours
  () => {
    exports.updateEvents();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
