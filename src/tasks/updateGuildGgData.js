const cron = require('node-cron');
const { db } = require('../database');
const { fetchGuildProfile } = require('../api/swgohgg');

async function update() {
  console.log(`Updating GP and member count data from SWGOH.GG.`);
  const allGuilds = await db.collection('guilds').find({}).sort({ name: 1 }).toArray();

  let i = 0;
  let failed = [];
  for (const guild of allGuilds) {
    if (!guild.gg) {
      failed.push(guild.name);
      continue;
    }

    const guildData = await fetchGuildProfile(guild.gg);
    if (!guildData) {
      failed.push(guild.name);
      continue;
    }

    const members = guildData.data.member_count;
    const gp = guildData.data.galactic_power;

    await db.collection('guilds').findOneAndUpdate({ name: guild.name }, { $set: { members: members, gp: gp } });

    i++;
  }

  console.log(`Updated GP and member count data for ${i} of ${allGuilds.length} guilds.`);
  if (failed.length) console.log(`Unable to update the following guilds: ${failed.join(', ')}`);
}

/** This task runs once every 12 hours  */
cron.schedule(
  '1 */12 * * *',
  () => {
    update();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
