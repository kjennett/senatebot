const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('account')
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
    await i.reply('https://tenor.com/view/circle-taiga-gif-15775330');
  },
};
