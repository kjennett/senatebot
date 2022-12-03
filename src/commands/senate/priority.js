const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../database');
const { config } = require('../../config');

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder().setName('priority').setDescription('View the current recruitment priority for all tiers.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    // --------------------
    // Recruitment Permission Check
    // --------------------

    if (!i.member.roles.cache.has(config.roles.recruitment) && !i.member.roles.cache.has(process.env.OWNER))
      return i.editReply('You must have the Recruitment role to use this command!');

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
        const gp = guild.gp / 1000000;
        guilds.push(
          `${i}. ${guild.name} - ${guild.members}/50 - ${gp.toFixed(2)}M GP\n_ _ -*${
            guild.last_recruit_name
          }* @ <t:${Math.floor(new Date(guild.last_recruit_time) / 1000)}:d>`
        );
        i++;
      }

      if (guilds.join() === '') guilds.push('No guilds in this tier!');

      e.addFields([
        {
          name: `Tier ${tier.number}`,
          value: guilds.join('\n'),
        },
      ]);
    }

    // --------------------
    // Interaction Response
    // --------------------

    return i.editReply({ embeds: [e] });
  },
};
