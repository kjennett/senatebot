const { db } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',

  async execute(member) {
    // Determine if the user that left the server has an active recruit thread
    const recruitResult = await db.collection('recruits').findOne({ discord_user_id: member.id });
    if (!recruitResult) return;

    // Fetch the recruit thread for the user
    const thread = await member.client.channels.fetch(recruitResult.thread_id);
    if (!thread) return;
    if (thread.archived) return;

    // Announce that the user has left the server
    const embed = new EmbedBuilder({
      title: 'This recruit has left the server.',
      description: 'Archiving recruitment thread...',
    }).setTimestamp();
    await thread.send({ embeds: [embed] });

    // Archive the recruit thread
    await thread.edit({
      name: `${recruitResult.discord_name} (T${recruitResult.tier}) - Left Server`,
    });
    await thread.setLocked(true);
    await thread.setArchived(true);

    // Remove the recruit thread from the database
    await db.collection('recruits').findOneAndDelete({ discord_user_id: member.id });
  },
};
