const { SlashCommandBuilder } = require('discord.js');
const { config } = require('../../config');

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder()
    .setName('recruitmentrules')
    .setDescription('Displays a view-only or edit link to the official Recruitment Rules, depending on your roles.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    // --------------------
    // Recruitment / ART Permissions Checks
    // --------------------

    if (!i.member.roles.cache.has(config.roles.recruitment))
      return i.editReply('You must have the Recruitment role to view the recruitment rules.');

    // --------------------
    // Send Google Doc Links
    // --------------------

    if (i.member.roles.cache.has(config.roles.allianceRecruitmentTeam)) {
      return i.editReply(
        '[This is an EDIT link for the recruitment rules - please DO NOT share this link!](https://docs.google.com/document/d/1SatHQcnBmB3zp-0DccrJWe7h62KzULcvnZLNRys53Xc/edit)'
      );
    } else {
      return i.editReply(
        '[Click this link to view the recruitment rules!](https://docs.google.com/document/u/1/d/e/2PACX-1vQbd8FzOhgM1q9eFe1KmeaSThTds1G_e7UwBXHUF042OEbA2TCz40SqGS8Gi-FTSel5xm7aB6jTCeQ7/pub)'
      );
    }
  },
};
