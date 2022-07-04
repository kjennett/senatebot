const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateAccountSummary } = require('../functions/accountSummary');
const { fetchHelp } = require('../functions/gamedata/playerData');
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
    const unparsedAllyCode = await interaction.options.getString('allycode');
    const parsedAllyCode = await parseAllyCode(unparsedAllyCode);
    if (!parsedAllyCode) return interaction.editReply('Error parsing ally code. Please try again!');
    await interaction.reply(`Fetching account summary for Ally Code ${parsedAllyCode}, please wait...`);

    if (await !fetchHelp(parsedAllyCode))
      return interaction.editReply('Unable to fetch account information. Please verify ally code and try again!');

    const accountSummary = await generateAccountSummary(parsedAllyCode);

    await interaction.editReply(accountSummary);
  },
};
