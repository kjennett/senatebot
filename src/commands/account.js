const { SlashCommandBuilder } = require('discord.js');
const generateAccountSummary = require('../functions/generateAccountSummary');
const fetchGgAccountData = require('../api/fetchGgAccountData');
const parseAllyCode = require('../api/parseAllyCode');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('Fetch game data for a specific player')
    .addSubcommand(s1 =>
      s1
        .setName('summary')
        .setDescription('Display a summary showing the current state of an account.')
        .addStringOption(option =>
          option
            .setName('allycode')
            .setDescription('Ally code or non-vanity SWGOH.gg link for the account.')
            .setRequired(true)
        )
    ),

  async execute(i) {
    await i.deferReply();

    // ---------- Determine Ally Code ---------- //
    const parsedAllyCode = await parseAllyCode(i.options.getString('allycode'));
    if (parsedAllyCode)
      return i.editReply(`Unable to determine ally code using the provided input: (${i.options.getString('allycode')})`);

    // ---------- Fetch Account Data ---------- //
    const ggData = await fetchGgAccountData(parsedAllyCode);
    if (!ggData)
      return i.editReply(
        `Unable to find SWGOH.GG data for ally code ${parsedAllyCode}. Please scan this ally code to add the account to SWGOH.GG: https://swgoh.gg/scan-player/`
      );

    // ---------- Generate Account Summary ---------- //
    const accountSummary = await generateAccountSummary(ggData);
    await i.editReply({ embeds: accountSummary.embeds });
    if (accountSummary.image) await i.followUp({ files: [accountSummary.image] });
  },
};
