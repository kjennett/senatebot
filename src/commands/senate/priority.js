const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../database');
const { config } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder().setName('priority').setDescription('View the current recruitment priority for all tiers.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    // Check for Recruitment role
    if (!i.member.roles.cache.has(config.roles.recruitment))
      return i.editReply('You must have the Recruitment role to use this command!');

    const tiers = await db.collection('tiers').find().sort({ number: -1 }).toArray();

    const e = new EmbedBuilder().setTitle('__Current Priority - All Tiers__');
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
          `${i}. ${guild.name} - ${guild.members}/50 - ${gp.toFixed(2)}M GP\n -- *${
            guild.last_recruit_name
          }* @ <t:${Math.floor(new Date(guild.last_recruit_time) / 1000)}:d>`
        );
        i++;
      }

      if (guilds.length === 0) guilds.push('No guilds in this tier!');

      e.addFields([
        {
          name: `__Tier ${tier.number}__`,
          value: guilds.join('\n'),
        },
      ]);
    }

    return i.editReply({ embeds: [e] });
  },
};
