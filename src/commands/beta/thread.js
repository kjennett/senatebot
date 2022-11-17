const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { db } = require('../../database');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('thread')
    .setDescription('Commands for managing threads.')
    .addSubcommandGroup(g1 =>
      g1
        .setName('keep-alive')
        .setDescription('Enable or disable keep-alive for a thread.')
        .addSubcommand(s1 => s1.setName('enable').setDescription('Enable keep-alive for a thread.'))
        .addSubcommand(s2 => s2.setName('disable').setDescription('Disable keep-alive for a thread.'))
    ),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    if (!i.member.roles.cache.has(config.roles.guildOfficer) && !i.member.roles.cache.has(process.env.OWNER))
      return i.editReply('You must have the Guild Officer role to use this command!');

    if (!i.channel.isThread()) return i.editReply('Please use this command inside a thread!');
    await i.channel.join();

    const sub = i.options.getSubcommand();
    const thread = await db.collection('threads').findOne({ id: i.channel.id });

    if (sub === 'enable' && thread) {
      return i.editReply('Keep-alive is already enabled for this thread. To disable, use `/thread keep-alive disable`.');
    }

    if (sub === 'enable' && !thread) {
      await db.collection('threads').insertOne({ id: i.channel.id });
      return i.editReply('Keep-alive is now enabled for this thread. To disable, use `/thread keep-alive disable`.');
    }

    if (sub === 'disable' && thread) {
      await db.collection('threads').deleteOne({ id: i.channel.id });
      return i.editReply('Keep-alive is now disabled for this thread. To re-enable, use `/thread keep-alive enable`.');
    }

    if (sub === 'disable' && !thread) {
      return i.editReply('Keep-alive was not enabled for this thread. To enable, use `/thread keep-alive enable`.');
    }
  },
};
