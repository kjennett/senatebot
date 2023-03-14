const { SlashCommandBuilder } = require('discord.js');
const { senateRoles } = require('../../configs/senateRoles');

module.exports = {
  data: new SlashCommandBuilder().setName('invite').setDescription('Invite SenateBot to another server.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    if (!i.member.roles.cache.has(senateRoles.guildOfficer))
      return i.editReply('You must be a Guild Officer to use this command.');

    await i.editReply(
      `You must have admin permissions on your server to use the link. The link will invite SenateBot to your server and grant it Admin permissions.\n__Please do not share outside The Senate.__\n[Invite SenateBot](${process.env.INVITELINK})`
    );
  },
};
