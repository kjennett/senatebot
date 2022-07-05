const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateAccountSummary } = require('../functions/generateAccountSummary');
const { fetchHelp } = require('../functions/fetchPlayerData');
const { parseAllyCode } = require('../functions/parseAllyCode');

module.exports = {
  enabled: true,
  hidden: false,

  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('Fetch game data for a specific player')
    .addSubcommand(sub1 =>
      sub1
        .setName('report')
        .setDescription('Fetch game information for a specific account.')
        .addStringOption(option =>
          option
            .setName('allycode')
            .setDescription('Ally code or non-vanity SWGOH.gg link for the account.')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const allycode = await interaction.options.getString('allycode');
    const parsedAllyCode = await parseAllyCode(allycode);
    if (parsedAllyCode instanceof Error) return interaction.editReply(parsedAllyCode.message);

    if (await !fetchHelp(parsedAllyCode))
      return interaction.editReply('Unable to fetch account information. Please verify ally code and try again!');

    const accountSummary = await generateAccountSummary(parsedAllyCode);

    await interaction.editReply(accountSummary);
  },
};
