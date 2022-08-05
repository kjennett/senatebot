const { dbDecisions, dbRecruits, dbGuilds } = require('../database');
const { MessageEmbed } = require('discord.js');

exports.generateTierPriority = async parsedAllyCode => {
  const recruit = await dbRecruits.findOne({ ally_code: parsedAllyCode });
  const guildsInTier = await dbGuilds.find({ tier: recruit.tier }).sort({ last_recruit_time: 1, name: 1 }).toArray();

  const embed = new MessageEmbed().setTitle(`Tier ${recruit.tier} Priority:`).setTimestamp();

  let i = 1;
  for (const guild of guildsInTier) {
    const decision = await dbDecisions.findOne({ ally_code: parsedAllyCode, guild: guild.name });

    let dec;
    if (!decision) dec = 'No Decision Entered :grey_question:';
    if (decision?.decision === 'Interested') dec = 'INTERESTED :white_check_mark:';
    if (decision?.decision === 'Pass') dec = 'PASS :no_entry_sign:';

    let lastRec;
    if (!guild.last_recruit_time) {
      lastRec = 'No last recruit data available';
    } else {
      lastRec = `Last Recruit: ${guild.last_recruit_name} @ <t:${Math.floor(new Date(guild.last_recruit_time) / 1000)}:f>`;
    }

    await embed.addField(`${i}. ${guild.name}: ${dec}`, lastRec);
    i++;
  }

  return { content: '_ _', embeds: [embed] };
};
