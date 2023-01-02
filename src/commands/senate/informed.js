const { config } = require('../../config');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('informed')
    .setDescription('Indicate that a player has been informed of their transfer.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });
    console.timeEnd(`${i.id} Response`);

    if (!i.member.roles.cache.has(config.roles.guildOfficer))
      return i.editReply('You must have the Guild Officer role to use player transfer commands.');

    if (i.channel.isThread() && i.channel.parentId === config.channels.tradeFederation) {
      await i.channel.send(
        ':white_check_mark: **This player has been informed of their transfer - you may now contact them and pitch your guild!** :white_check_mark:'
      );
      await i.editReply(':white_check_mark:');
    } else {
      await i.editReply('Please use this command in a Trade Federation transfer thread.');
    }
  },
};