const { client } = require('../client');
const { newEmbed } = require('./newEmbed');
const { config } = require('../config');
const { db } = require('../database');

const priorityBoard = async () => {
  const allTierEmbeds = [];

  const titleEmbed = newEmbed()
    .setTitle('__Current Tier Priority__')
    .setDescription('Last Recruit Time > Alphabetical\nUpdated automatically every 5 minutes.')
    .setTimestamp();
  allTierEmbeds.push(titleEmbed);

  const tiers = await db.collection('tiers').find().sort({ number: -1 }).toArray();
  for (const tier of tiers) {
    const tierEmbed = newEmbed().setFooter({ text: '', iconURL: '' }).setTitle(`__Tier ${tier.number}__`);

    const guildsInTier = await db
      .collection('guilds')
      .find({ tier: tier.number })
      .sort({ last_recruit_time: 1, name: 1 })
      .toArray();

    let i = 1;
    for (const guild of guildsInTier) {
      if (guild.last_recruit_name) {
        tierEmbed.addField(
          `${i}. ${guild.name}`,
          `${guild.last_recruit_name} - <t:${Math.floor(new Date(guild.last_recruit_time) / 1000)}:d>`
        );
      } else {
        tierEmbed.addField(`${i}. ${guild.name}`, '-----');
      }

      i++;
    }

    allTierEmbeds.push(tierEmbed);
  }

  const channel = await client.channels.fetch(config.channels.recruitmentRoom);

  const post = await db.collection('posts').findOne({ name: 'priority_board' });
  if (post) {
    const message = await channel.messages.fetch(post.id);
    await message.edit({ embeds: allTierEmbeds });
    await message.unpin();
    await message.pin();
  } else {
    const message = await channel.send({ embeds: allTierEmbeds });
    await message.pin();
    await db.collection('posts').insertOne({ name: 'priority_board', id: message.id });
  }
};

exports.updatePriorityBoard = async () => {
  await priorityBoard();
  setInterval(() => {
    priorityBoard();
  }, 300000);
};
