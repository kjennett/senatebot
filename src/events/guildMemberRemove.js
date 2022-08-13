const { dbRecruits } = require('../database');
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',

  async execute(member) {
    const recruitResult = await dbRecruits.findOne({ discord_user_id: member.id });
    if (!recruitResult) return;

    const thread = await member.client.channels.fetch(recruitResult.thread_id);
    if (!thread) return;
    if (thread.archived) return;

    const embed = new MessageEmbed({
      title: 'This recruit has left the server.',
      description: 'Archiving recruitment thread...',
    }).setTimestamp();
    await thread.send({ embeds: [embed] });

    await thread.edit({
      name: `${recruitResult.discord_name} (T${recruitResult.tier}) - Left Server`,
    });
    await thread.setLocked(true);
    await thread.setArchived(true);

    await dbRecruits.findOneAndDelete({ discord_user_id: member.id });
  },
};
