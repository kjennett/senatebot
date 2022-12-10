const { db } = require('../database');
const { EmbedBuilder } = require('discord.js');

exports.generateTierPriority = async parsedAllyCode => {
  const recruit = await db.collection('recruits').findOne({ ally_code: parsedAllyCode });

  const guildsInTier = await db.collection('guilds').find({ tier: recruit.tier }).sort({ last_recruit_time: 1 }).toArray();

  const embed = new EmbedBuilder().setTitle(`Tier ${recruit.tier} Priority:`);

  let i = 1;
  for (const guild of guildsInTier) {
    const decision = await db.collection('decisions').findOne({ ally_code: parsedAllyCode, guild: guild.name });

    let dec;
    if (!decision) dec = 'No Decision Entered';
    if (decision?.decision === 'Interested') dec = 'INTERESTED';
    if (decision?.decision === 'Pass') dec = 'PASS';

    let lastRec;
    if (!guild.last_recruit_time) {
      lastRec = 'No last recruit data available';
    } else {
      lastRec = `Last Recruit: ${guild.last_recruit_name} @ <t:${Math.floor(new Date(guild.last_recruit_time) / 1000)}:f>`;
    }

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
