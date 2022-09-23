const { db } = require('../database');
const { EmbedBuilder } = require('discord.js');

/**
 * Returns an embed containing the current tier priority, recruit decisions,
 * and last recruit information for all the guilds in a recruit's tier.
 */
module.exports = async parsedAllyCode => {
  // Find a recruitment thread in the database for the recruit with the provided ally code
  const recruit = await db.collection('recruits').findOne({ ally_code: parsedAllyCode });

  // Find all guilds in the recruit's tier, sorted by last recruit time
  const guildsInTier = await db.collection('guilds').find({ tier: recruit.tier }).sort({ last_recruit_time: 1 }).toArray();

  // Generate a new embed to display the priority for the recruit's tier
  const embed = new EmbedBuilder().setTitle(`Tier ${recruit.tier} Priority:`);

  let i = 1;
  for (const guild of guildsInTier) {
    // Find any decisions entered by guilds with regards to this recruit
    const decision = await db.collection('decisions').findOne({ ally_code: parsedAllyCode, guild: guild.name });

    // Display the decision, if one has been entered, for each guild
    let dec;
    if (!decision) dec = 'No Decision Entered';
    if (decision?.decision === 'Interested') dec = 'INTERESTED';
    if (decision?.decision === 'Pass') dec = 'PASS';

    // Display the last recruit name and time, if one has been entered
    let lastRec;
    if (!guild.last_recruit_time) {
      lastRec = 'No last recruit data available';
    } else {
      lastRec = `Last Recruit: ${guild.last_recruit_name} @ <t:${Math.floor(new Date(guild.last_recruit_time) / 1000)}:f>`;
    }

    // Add the decision and recruit display to the priority embed
    await embed.addFields([
      {
        name: `${i}. ${guild.name}: ${dec}`,
        value: lastRec,
      },
    ]);
    i++;
  }

  return { content: '_ _', embeds: [embed] };
};
