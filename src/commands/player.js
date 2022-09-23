const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js');
const generateAccountSummary = require('../functions/generateAccountSummary');
const { fetchHelp } = require('../functions/fetchPlayerData');
const parseAllyCode = require('../functions/parseAllyCode');

const reportSubcommand = new SlashCommandSubcommandBuilder()
  .setName('report')
  .setDescription('Display a summary of information about an account.')
  .addStringOption(option =>
    option.setName('allycode').setDescription('Ally code or non-vanity SWGOH.gg link for the account.').setRequired(true)
  );

module.exports = {
  enabled: true,

  // ---------- COMMAND DATA ---------- //
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('Fetch game data for a specific player')
    .addSubcommand(reportSubcommand),

  // ---------- COMMAND FUNCTION ---------- //
  async execute(interaction) {
    await interaction.deferReply();

    const parsedAllyCode = await parseAllyCode(await interaction.options.getString('allycode'));
    if (parsedAllyCode instanceof Error) return interaction.editReply(parsedAllyCode.message);

    if (await !fetchHelp(parsedAllyCode))
      return interaction.editReply('Unable to fetch account information. Please verify ally code and try again!');

    const accountSummary = await generateAccountSummary(parsedAllyCode);

    await interaction.editReply({ embeds: accountSummary.embeds });
    if (accountSummary.image) await interaction.followUp({ files: [accountSummary.image] });
  },
};
