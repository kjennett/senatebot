const { db } = require('../database');
const ical = require('node-ical');
const cron = require('node-cron');
const { apiUrls } = require('../configs/apiUrls');

/** Update the database with fresh event data from SWGOH Events, if it is available. */
async function updateEvents() {
  const calendar = await ical.async.fromURL(apiUrls.events);
  await db.collection('events').deleteMany();
  await db.collection('events').insertMany(Object.values(calendar));
}

/** This task runs once every 12 hours  */
cron.schedule(
  '1 */12 * * *',
  () => {
    updateEvents();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
