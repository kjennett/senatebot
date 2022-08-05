const { SlashCommandBuilder } = require('@discordjs/builders');
const { config } = require('../config');
const { dbThreads } = require('../database');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('thread')
    .setDescription('Tools for managing threads.')
    .addSubcommand(sub1 =>
      sub1
        .setName('keepalive')
        .setDescription('Register a thread with SenateBot to keep it from auto-archiving.')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Whether keepalive should be active for this thread.').setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.channel.isThread()) return interaction.editReply({ embeds: [config.errorEmbeds.channelNotThread] });

    const enabled = await interaction.options.getBoolean('enabled');
    const dbThread = await dbThreads.findOne({ id: interaction.channel.id });

    await interaction.channel.join();

    if (enabled && dbThread) return interaction.editReply({ embeds: [config.successEmbeds.keepAliveAlreadyOn] });

    if (enabled && !dbThread) {
      await dbThreads.insertOne({ id: interaction.channel.id });
      return interaction.editReply({ embeds: [config.successEmbeds.keepAliveRegistered] });
    }

    if (!enabled && dbThread) {
      await dbThreads.deleteOne({ id: interaction.channel.id });
      return interaction.editReply({ embeds: [config.successEmbeds.keepAliveUnregistered] });
    }

    if (!enabled && !dbThread) {
      return interaction.editReply({ embeds: [config.errorEmbeds.noKeepAliveFound] });
    }
  },
};
