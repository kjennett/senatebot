const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gacwatch')
    .setDescription('Enable GAC Watch, which will notify you when your opponent gains banners in GAC.'),

  async execute(i) {
    await i.deferReply({ ephemeral: true });
  },
};
