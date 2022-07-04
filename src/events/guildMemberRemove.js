const { db } = require('../database');

module.exports = {
  name: 'guildMemberRemove',
  on: true,

  async execute(member) {
    const recruitResult = await db.collection('recruits').findOne({ discord_user_id: member.id });
    if (!recruitResult) return;

    const thread = await member.client.channels.fetch(recruitResult.thread_id);
    if (!thread) return;
    if (thread.archived) return;

    await thread.send('Recruit has left the server. Archiving recruitment thread...');
    await thread.edit({
      name: `${recruitResult.discord_name} (T${recruitResult.tier}) - Left Server`,
    });
    await thread.setLocked(true);
    await thread.setArchived(true);

    await db.collection('recruits').findOneAndDelete({ discord_user_id: member.id });
  },
};
