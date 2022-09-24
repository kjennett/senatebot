const { db } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',

  async execute(member) {
    const rec = await db.collection('recruits').findOne({ discord_user_id: member.id });
    if (!rec) return;

    const t = await member.client.channels.fetch(rec.thread_id);
    if (!t) return;
    if (t.archived) return;

    const embed = new EmbedBuilder()
      .setTitle('This recruit has left the server.')
      .setDescription('Archiving recruitment thread...');

    await t.send({ embeds: [embed] });
    await t.edit({
      name: `${rec.discord_name} (T${rec.tier}) - Left Server`,
    });
    await t.setLocked(true);
    await t.setArchived(true);

    await db.collection('recruits').findOneAndDelete({ discord_user_id: member.id });
  },
};
