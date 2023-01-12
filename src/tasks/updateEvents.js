const { db } = require('../database');
const ical = require('node-ical');
const cron = require('node-cron');
const { apiUrls } = require('../configs/apiUrls');

exports.updateEvents = async () => {
  const calendar = await ical.async.fromURL(apiUrls.events);
  await db.collection('events').deleteMany();
  await db.collection('events').insertMany(Object.values(calendar));
  console.log('Game event schedule data updated.');
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
