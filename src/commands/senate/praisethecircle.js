const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder().setName('praisethecircle').setDescription('Fetch game data for a specific player'),

  async execute(i) {
    await i.reply('https://tenor.com/view/circle-taiga-gif-15775330');
  },
};
