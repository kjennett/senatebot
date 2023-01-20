const { SlashCommandBuilder } = require('discord.js');
const { updateEvents } = require('../../tasks/updateEvents');

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('updateevents')
    .setDescription('Update the bot database with the current event schedule from SWGOH Events.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });
    await updateEvents();
    await i.editReply('Event data updated.');
  },
};
