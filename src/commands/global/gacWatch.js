const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gacwatch')
    .setDescription('Register to receive notifications when your opponent gains banners in GAC.')
    .addStringOption(option =>
      option.setName('yourallycode').setDescription('Ally code OR swgoh.gg profile for YOUR account.').setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('opponentallycode')
        .setDescription("Ally code OR swgoh.gg profile for YOUR OPPONENT'S account.")
        .setRequired(true)
    ),

  async execute(i) {
    await i.deferReply();
  },
};
