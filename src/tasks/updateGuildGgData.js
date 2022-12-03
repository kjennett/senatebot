const cron = require('node-cron');
const { db } = require('../database');
const fetchGgGuildData = require('../api/fetchGgGuildData');

// --------------------
// GG Guild Data Update Function
// --------------------

async function update() {
  console.log(`Updating GP and member count data from SWGOH.GG.`);
  const allGuilds = await db.collection('guilds').find({}).sort({ name: 1 }).toArray();

  let i = 0;
  let failed = [];
  for (const guild of allGuilds) {
    // --------------------
    // Fetch Guild Data
    // --------------------

    if (!guild.gg) {
      failed.push(guild.name);
      continue;
    }

    const guildData = await fetchGgGuildData(guild.gg);

    if (!guildData) {
      failed.push(guild.name);
      continue;
    }

    const members = guildData.data.member_count;
    const gp = guildData.data.galactic_power;

    // --------------------
    // Update Database
    // --------------------

    await db.collection('guilds').findOneAndUpdate({ name: guild.name }, { $set: { members: members, gp: gp } });

    // --------------------
    // Update Completed Count
    // --------------------

    i++;
  }

  console.log(`Successfully update GP and member count data for ${i} of ${allGuilds.length} guilds.`);
  if (failed.length) console.log(`Unable to update the following guilds: ${failed.join(', ')}`);
}

// --------------------
// GG Guild Data Update Task
// --------------------

cron.schedule(
  '* */6 * * *',
  () => {
    update();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
