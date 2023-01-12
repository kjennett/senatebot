const cron = require('node-cron');
const { db } = require('../database');
const { fetchAllAbilities, fetchAllCharacters, fetchAllShips } = require('../api/swgohgg');

exports.updateGameData = async () => {
  const [characters, ships, abilities] = await Promise.allSettled([
    fetchAllCharacters(),
    fetchAllShips(),
    fetchAllAbilities(),
  ]);

  // Only delete and replace data if new data is fetched - because this is static game data, and because
  // data is rarely ever removed, prefer stale data over no data at all
  if (characters.value) {
    await db.collection('characters').deleteMany();
    await db.collection('characters').insertMany(characters.value);
  }
  if (ships.value) {
    await db.collection('ships').deleteMany();
    await db.collection('ships').insertMany(ships.value);
  }
  if (abilities.value) {
    await db.collection('abilities').deleteMany();
    await db.collection('abilities').insertMany(abilities.value);
  }

  console.log('Static game data updated.');
};

cron.schedule(
  '5 */6 * * *', // Runs once every 6 hours
  () => {
    exports.updateGameData();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
