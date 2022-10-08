const { db } = require('../database');
const ical = require('node-ical');

async function updateEvents() {
  const calendar = await ical.async.fromURL('https://swgohevents.com/ical');
  await db.collection('events').deleteMany();
  await db.collection('events').insertMany(Object.values(calendar));
}

module.exports = async () => {
  await updateEvents();
  setInterval(() => {
    updateEvents();
  }, 900000);
};
