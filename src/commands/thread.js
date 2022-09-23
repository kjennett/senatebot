const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { config } = require('../config');
const { db } = require('../database');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('thread')
    .setDescription('Commands for managing threads.')
    .addSubcommand(sub1 =>
      sub1
        .setName('keepalive')
        .setDescription('Register a thread with SenateBot to keep it from auto-archiving.')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Whether keepalive should be active for this thread.')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.channel.isThread())
      return interaction.editReply({ embeds: [config.errorEmbeds.useCommandInThread] });

    const enabled = await interaction.options.getBoolean('enabled');
    const dbThread = await db.collection('threads').findOne({ id: interaction.channel.id });
    await interaction.channel.join();

    if (enabled && dbThread)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({ title: 'This thread is __already registered__ for Keep-Alive.' }),
        ],
      });

    if (enabled && !dbThread) {
      await db.collection('threads').insertOne({ id: interaction.channel.id });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({ title: 'This thread has been __registered__ for Keep-Alive.' }),
        ],
      });
    }

    if (!enabled && dbThread) {
      await db.collection('threads').deleteOne({ id: interaction.channel.id });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({ title: 'This thread has been __un-registered__ from Keep-Alive.' }),
        ],
      });
    }

    if (!enabled && !dbThread) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title:
              'This thread was not previously registered for Keep-Alive. To register, use this command again with the *enabled* parameter set to True.',
          }),
        ],
      });
    }
  },
};
