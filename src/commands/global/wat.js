const { SlashCommandBuilder } = require('discord.js');
const { watSummary } = require('../../lib/account/watSummary');
const { fetchAccount } = require('../../api/swgohgg');
const { extractAllyCode } = require('../../lib/account/extractAllyCode');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('wat')
    .setDescription('Generate a detailed report on the Wat SM readiness of an account, with recommendations')
    .addStringOption(option =>
      option.setName('allycode').setDescription('Ally code or non-vanity SWGOH.gg link for the account.').setRequired(true)
    ),

  async execute(i) {
    await i.deferReply();

    const parsedAllyCode = extractAllyCode(i.options.getString('allycode'));
    if (!parsedAllyCode)
      return i.editReply(`Unable to determine ally code using the provided input: (${i.options.getString('allycode')})`);

    const ggData = await fetchAccount(parsedAllyCode);
    if (!ggData)
      return i.editReply(
        `Unable to find SWGOH.GG data for ally code ${parsedAllyCode}. Please scan this ally code to add the account to SWGOH.GG: https://swgoh.gg/scan-player/`
      );

    const summary = await watSummary(ggData);
    await i.editReply(summary);
  },
};
