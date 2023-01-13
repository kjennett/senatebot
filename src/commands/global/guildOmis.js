const { SlashCommandBuilder } = require('discord.js');
const { fetchGuildProfile } = require('../../api/swgohgg');
const { guildOmiSummary } = require('../../lib/guild/guildOmiSummary');
const { db } = require('../../database');
const { guildChoices } = require('../../configs/guildChoices');

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder()
    .setName('guildomis')
    .setDescription('Generates a report of omicron statistics for a guild.')
    .addStringOption(o =>
      o
        .setName('guild')
        .setDescription('The guild to pull omicron information about.')
        .addChoices(...guildChoices)
        .setRequired(true)
    )
    .addBooleanOption(o =>
      o.setName('detailed').setDescription('Whether to include text files with more detailed information about each player.')
    ),

  async execute(i) {
    await i.deferReply();

    const guildName = i.options.getString('guild');
    const dbGuild = await db.collection('guilds').findOne({ name: guildName });
    if (!dbGuild) return i.editReply(`Guild ${guildName} was not found in the database.`);
    if (!dbGuild.gg) return i.editReply(`Unable to find a SWGOH.GG guild ID for ${guildName}.`);

    const ggGuildData = await fetchGuildProfile(dbGuild.gg);
    const omiSummary = await guildOmiSummary(ggGuildData);
    await i.editReply({ embeds: omiSummary.embeds });
    if (i.options.getBoolean('detailed')) await i.channel.send({ files: omiSummary.files });
  },
};
