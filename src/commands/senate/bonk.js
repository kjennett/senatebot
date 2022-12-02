const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { db } = require('../../database');

module.exports = {
  enabled: true,

  data: new ContextMenuCommandBuilder().setName('BONK').setType(ApplicationCommandType.Message),

  async execute(i) {
    if (i.member.id !== process.env.OWNER) {
      return i.reply({ content: `BONK! You don't have permission to use SenateBONK!`, ephemeral: true });
    }

    await i.reply({ content: 'SenateBONK Activated!', ephemeral: true });

    const message = i.targetMessage;
    await message.reply('https://tenor.com/view/bonk-mega-bonk-bonk-dog-bonkers-bonk-anime-gif-24565990');

    let bonkCount = 1;
    const bonkedUser = await db.collection('bonks').findOne({ id: message.member.id });
    if (bonkedUser) bonkCount = bonkedUser.count + 1;

    if (!bonkedUser) await db.collection('bonks').insertOne({ id: message.member.id, count: bonkCount });
    if (bonkedUser) await db.collection('bonks').findOneAndUpdate({ id: message.member.id }, { $set: { count: bonkCount } });

    return message.member.send(
      `BONK! The following message has been bonked:\n\n${message.url}\n\nYou have been bonked ${bonkCount} times. Don't make SenateBONK send you to horny jail!`
    );
  },
};
