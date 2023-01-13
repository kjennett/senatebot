const cron = require('node-cron');
const { db } = require('../database');
const { fetchGuildProfile } = require('../api/swgohgg');

exports.updateGuildGgData = async () => {
  const allGuilds = await db.collection('guilds').find({}).sort({ name: 1 }).toArray();

  let noGgGuilds = allGuilds.map(guild => guild.name).filter(guild => guild.gg === null);
  if (noGgGuilds.length)
    console.log(`Unable to update the following guilds (no .GG guild ID found): ${noGgGuilds.join(', ')}`);

  const validGuilds = allGuilds.filter(guild => guild.gg !== null);

  const failedGuilds = [];
  for (const guild of validGuilds) {
    const guildData = await fetchGuildProfile(guild.gg);
    if (!guildData) {
      failedGuilds.push(guild.name);
      continue;
    }

    const memberCount = guildData.data.member_count;
    const gp = guildData.data.galactic_power;

    await db.collection('guilds').findOneAndUpdate({ name: guild.name }, { $set: { members: memberCount, gp: gp } });
  }

  if (failedGuilds.length) console.log(`Failed to fetch data for the following guilds: ${failedGuilds.name}`);
  console.log('Guild member count and galactic power data updated.');
};

cron.schedule(
  '10 */6 * * *', // Runs once every 6 hours
  () => {
    exports.updateGuildGgData();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
