const { SlashCommandBuilder } = require('discord.js');
const { config } = require('../../config');

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder().setName('invite').setDescription('Invite SenateBot to another server.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    if (!i.member.roles.cache.has(config.roles.guildOfficer))
      return i.editReply('You must be a Guild Officer to use this command.');

    await i.editReply(
      `Use this link to invite SenateBot to your server. You must have admin permissions on your server to use the link. __Please do not share outside The Senate.__\n\n[Invite SenateBot](${config.invite})`
    );
  },
};
