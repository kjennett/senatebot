const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../database');

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder().setName('priority').setDescription('View the current recruitment priority for all tiers.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    // --------------------
    // Generate Embed
    // --------------------

    const e = new EmbedBuilder().setTitle('__Current Tier Priority__');

    // --------------------
    // Fetch Tiers
    // --------------------

    const tiers = await db.collection('tiers').find().sort({ number: -1 }).toArray();

    // --------------------
    // Determine Priority For Each Tier
    // --------------------

    for (const tier of tiers) {
      const guildsInTier = await db
        .collection('guilds')
        .find({ tier: tier.number })
        .sort({ last_recruit_time: 1 })
        .toArray();

      const guilds = [];
      let i = 1;
      for (const guild of guildsInTier) {
        guilds.push(
          `${i}. ${guild.name} - *${guild.last_recruit_name}* | <t:${Math.floor(
            new Date(guild.last_recruit_time) / 1000
          )}:d>`
        );
        i++;
      }

      e.addFields([
        {
          name: `Tier ${tier.number}`,
          value: guilds.join('\n'),
        },
      ]);
    }

    return i.editReply({ embeds: [e] });
  },
};
