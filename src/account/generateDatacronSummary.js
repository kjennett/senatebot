const config = require('../config');
const { EmbedBuilder, hyperlink } = require('discord.js');

module.exports = async ggData => {
  const dcSummaryEmbed = new EmbedBuilder().setDescription(`${ggData.data.ally_code}`);

  dcSummaryEmbed
    .setTitle(`Datacrons: ${ggData.data.name}`)
    .setThumbnail(ggData.data.portrait_image)
    .setTimestamp(Date.parse(ggData.data.last_updated))
    .setFooter({ text: 'Source: SWGOH.GG // Last Sync Time' })
    .setURL(`https://swgoh.gg${ggData.data.url}datacrons/`)
    .setDescription('Showing all datacrons at tier 6+');

  const crons = ggData.datacrons.filter(cron => cron.tier >= 6);
  for (const cron of crons) {
    const title = hyperlink(`${config.datacronSets[cron.set_id]} (Tier ${cron.tier})`, `https://swgoh.gg/${cron.url}`);
    const stats = [];

    let i = 1;
    for (const tier of cron.tiers) {
      if (tier.ability_description) {
        stats.push(`Tier ${i}: ${tier.ability_description}`);
      } else {
        const stat = (tier.stat_value * 100).toFixed(2);
        stats.push(`Tier ${i}: ${stat}% ${tier.scope_target_name}`);
      }
      i++;
    }

    dcSummaryEmbed.addFields([
      {
        name: title,
        value: stats.join('\n'),
      },
    ]);
  }

  return { embeds: [dcSummaryEmbed] };
};
