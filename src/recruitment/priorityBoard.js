const { EmbedBuilder } = require('discord.js');
const client = require('../client');
const config = require('../config');
const { db } = require('../database');

const generatePriorityBoard = async () => {
  // Collection of embeds to be posted in the recruitment channel
  const allTierEmbeds = [];

  // Title embed displays the sort order and refresh interval
  const titleEmbed = new EmbedBuilder()
    .setTitle('__Current Tier Priority__')
    .setDescription('Last Recruit Time > Alphabetical\nUpdated automatically every 5 minutes.');
  allTierEmbeds.push(titleEmbed);

  // Fetch all registered tiers in the database, in descending order (starting with the highest tier number)
  const tiers = await db.collection('tiers').find().sort({ number: -1 }).toArray();

  // Generate a priority list embed for each recruitment tier
  for (const tier of tiers) {
    const tierEmbed = new EmbedBuilder().setTitle(`__Tier ${tier.number}__`);

    // Fetch all the guilds in a tier, sorted by last recruit time
    const guildsInTier = await db.collection('guilds').find({ tier: tier.number }).sort({ last_recruit_time: 1 }).toArray();

    let i = 1;
    for (const guild of guildsInTier) {
      // If a guild shows a last recruit name/time, show the guild, recruit name, and time they were claimed
      if (guild.last_recruit_name) {
        tierEmbed.addFields([
          {
            name: `${i}. ${guild.name}`,
            value: `${guild.last_recruit_name} - <t:${Math.floor(new Date(guild.last_recruit_time) / 1000)}:d>`,
          },
        ]);
      } else {
        tierEmbed.addFields([
          {
            name: `${i}. ${guild.name}`,
            value: '-----',
          },
        ]);
      }
      i++;
    }
    // Add the tier's embed to the array of embeds to be displayed
    allTierEmbeds.push(tierEmbed);
  }

  // Fetch recruitment channel by its ID
  const channel = await client.channels.fetch(config.channels.recruitmentRoom);

  // If the priority board already exists (and is registered in the database), edit it to display current embeds,
  // otherwise, post a new priority board and store its ID in the database for future use.
  const post = await db.collection('posts').findOne({ name: 'priority_board' });
  if (post) {
    const message = await channel.messages.fetch(post.id);
    await message.edit({ embeds: allTierEmbeds });
  } else {
    const message = await channel.send({ embeds: allTierEmbeds });
    await message.pin();
    await db.collection('posts').insertOne({ name: 'priority_board', id: message.id });
  }
};

/**
 * Updates the recruitment tier priority list pinned in #recruitment,
 * and starts the auto-updater which automatically updates the board every 5 minutes.
 */
module.exports = async () => {
  await generatePriorityBoard();
  setInterval(() => {
    generatePriorityBoard();
  }, 300000);
};
