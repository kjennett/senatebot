const { extractAllyCode } = require('../../lib/account/extractAllyCode');
const { fetchAccount } = require('../../api/swgohgg');
const { config } = require('../../config');
const { accountSummary } = require('../../lib/account/accountSummary');
const { generateTierPriority } = require('../../lib/recruitment/generateTierPriority');
const { db } = require('../../database');
const { EmbedBuilder, SlashCommandBuilder, roleMention } = require('discord.js');
const { addRecruit } = require('../../lib/recruitment/addRecruit');
const { findStartingTier } = require('../../lib/recruitment/findStartingTier');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('newrecruit')
    .setDescription('Creates a new recruitment thread.')
    .addUserOption(option =>
      option.setName('discorduser').setDescription('Tag the Discord user of the new recruit').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('allycode').setDescription('Ally code OR swgoh.gg profile for the account.').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('notes').setDescription('Any relevant information for recruiters to know (KAM, WAT, CPit, etc.)')
    ),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    const [discorduser, allycode, notes] = await Promise.all([
      i.options.getUser('discorduser'),
      i.options.getString('allycode'),
      i.options.getString('notes'),
    ]);

    // Extract an ally code from the provided input
    const ally = extractAllyCode(allycode);
    if (!ally)
      return i.editReply(`Unable to determine ally code using the provided input: (${i.options.getString('allycode')})`);

    // Return error if a recruit thread already exists for that ally code
    if (await db.collection('recruits').countDocuments({ ally_code: ally }))
      return i.editReply(`A recruitment thread already exists for this ally code.`);

    // Fetch SWGOH.GG game data for the account, return error if not available
    const ggData = await fetchAccount(ally);
    if (!ggData)
      return i.editReply(
        `Unable to find SWGOH.GG data for ally code ${ally}. Please scan this ally code to add the account to SWGOH.GG: https://swgoh.gg/scan-player/`
      );

    // Find and retrieve the database record for the starting recruitment tier.
    const startingTier = await findStartingTier(ggData.data.galactic_power);
    const tier = await db.collection('tiers').findOne({ number: startingTier });

    // Generate an account summary embed for the account.
    const summary = await accountSummary(ggData);

    // Create a thread for the recruit in the recruitment channel
    const recruitmentChannel = await i.client.channels.fetch(config.channels.recruitmentRoom);
    const thread = await recruitmentChannel.threads.create({
      name: `${discorduser.username} (T${startingTier})`,
      autoArchiveDuration: 10080,
    });
    await thread.join();
    await thread.send(summary);
    if (notes) {
      const notesEmbed = new EmbedBuilder().setTitle('Recruitment Notes').setDescription(notes);
      await thread.send({ embeds: [notesEmbed] });
    }
    const priorityMessage = await thread.send('Tier Priority:');

    // Add the recruit thread information to the database
    await addRecruit(ally, discorduser.username, discorduser.id, startingTier, thread.id, thread.url, priorityMessage.id);

    // Generate tier priority for the recruitment tier, and edit the priority message
    const priorityEmbed = await generateTierPriority(ally);
    await priorityMessage.edit(priorityEmbed);

    await thread.send(roleMention(tier.recruiter_role_id));
    return i.editReply(`Recruit thread for ${discorduser.username} has been created.`);
  },
};
