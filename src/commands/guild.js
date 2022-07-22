const { SlashCommandBuilder, SlashCommandSubcommandBuilder, hyperlink } = require('@discordjs/builders');
const { fetchGgGuild, fetchComlink } = require('../functions/fetchPlayerData');
const { parseAllyCode } = require('../functions/parseAllyCode');
const { MessageEmbed } = require('discord.js');

const reportSubcommand = new SlashCommandSubcommandBuilder()
  .setName('report')
  .setDescription('Display a summary of information about a guild.')
  .addStringOption(option =>
    option
      .setName('allycode')
      .setDescription('Ally code or non-vanity SWGOH.gg link for any account in the guild.')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option.setName('showactivity').setDescription("Include a report of all current guild members' last activity time.")
  );

module.exports = {
  enabled: true,
  hidden: false,

  data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Fetch game data for a specific player')
    .addSubcommand(reportSubcommand),

  async execute(interaction) {
    await interaction.deferReply();
    const parsedAllyCode = await parseAllyCode(await interaction.options.getString('allycode'));
    if (parsedAllyCode instanceof Error) return interaction.editReply(parsedAllyCode.message);

    const showActivity = await interaction.options.getBoolean('showactivity');

    const comlinkData = await fetchComlink(parsedAllyCode);
    if (!comlinkData) return interaction.editReply('Unable to fetch account/guild information.');

    const guildData = await fetchGgGuild(comlinkData.guildId);
    if (!guildData) return interaction.editReply('Unable to fetch guild data.');

    const guildInfoEmbed = new MessageEmbed({
      title: `${comlinkData.guildName}`,
      description: `Guild Information`,
      fields: [
        {
          name: 'Public Message',
          value: `${guildData.data.external_message}`,
        },
        {
          name: 'Members',
          value: `${guildData.data.member_count}`,
        },
        {
          name: 'Galactic Power (Total)',
          value: `${guildData.data.galactic_power.toLocaleString()}`,
        },
        {
          name: 'Galactic Power (Average)',
          value: `${guildData.data.avg_galactic_power.toLocaleString()}`,
        },
        {
          name: `GAC Skill Rating (Average)`,
          value: `${guildData.data.avg_skill_rating.toLocaleString()}`,
        },
        {
          name: `SWGOH.gg Guild Page`,
          value: hyperlink(`${comlinkData.guildName}`, `https://swgoh.gg/g/${comlinkData.guildId}`),
        },
      ],
    }).setTimestamp(guildData.data.last_sync);

    await interaction.editReply({ embeds: [guildInfoEmbed] });
  },
};
