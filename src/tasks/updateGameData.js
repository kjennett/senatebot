const cron = require('node-cron');
const { db } = require('../database');
const { fetchAllAbilities, fetchAllCharacters, fetchAllShips } = require('../api/swgohgg');

/** Update the database with fresh character, ship, and ability data from SWGOH.GG, if available. */
async function updateGameData() {
  console.log('Updating static character, ship, and ability data from SWGOH.GG');
  const [characters, ships, abilities] = await Promise.all([fetchAllCharacters(), fetchAllShips(), fetchAllAbilities()]);

  // Only delete and replace data if new data is fetched - because this is static game data, and because
  // data is rarely ever removed, prefer stale data over no data at all

  if (characters) {
    await db.collection('characters').deleteMany();
    await db.collection('characters').insertMany(characters);
  }

  if (ships) {
    await db.collection('ships').deleteMany();
    await db.collection('ships').insertMany(ships);
  }

  if (abilities) {
    await db.collection('abilities').deleteMany();
    await db.collection('abilities').insertMany(abilities);
  }

  console.log();
}

/** This task runs once every 12 hours  */
cron.schedule(
  '1 */12 * * *',
  () => {
    updateGameData();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
