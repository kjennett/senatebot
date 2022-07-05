const { SlashCommandBuilder, roleMention, userMention } = require('@discordjs/builders');
const { newEmbed } = require('../functions/newEmbed');
const { parseAllyCode } = require('../functions/parseAllyCode');
const { config } = require('../config');
const { fetchHelp } = require('../functions/gamedata/playerData');
const { generateAccountSummary } = require('../functions/accountSummary');
const { generateTierPriority } = require('../functions/recruitment/generateTierPriority');
const { db } = require('../database');

async function findStartingTier(gp) {
  const result = await db.collection('tiers').findOne({
    maximum_gp: { $gte: gp },
    minimum_gp: { $lte: gp },
  });
  return result.number;
}

module.exports = {
  enabled: true,
  hidden: false,

  data: new SlashCommandBuilder()
    .setName('recruit')
    .setDescription('Manages recruits in the SenateBot database.')
    .addSubcommand(sub1 =>
      sub1
        .setName('add')
        .setDescription('Add a recruit to the database and create a recruitment thread.')
        .addUserOption(option =>
          option.setName('discorduser').setDescription('Tag the Discord user of the new recruit').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('allycode').setDescription('Ally code OR swgoh.gg profile for the account.').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('notes').setDescription('Any relevant information for recruiters to know (KAM, WAT, CPit, etc.')
        )
    )
    .addSubcommand(sub1 =>
      sub1
        .setName('linkthread')
        .setDescription('Link a current thread in the recruitment room to a recruit.')
        .addUserOption(option =>
          option.setName('discorduser').setDescription('Tag the Discord user of the new recruit').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('allycode').setDescription('Ally code OR swgoh.gg profile for the account.').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('notes').setDescription('Any relevant information for recruiters to know (KAM, WAT, CPit, etc.')
        )
    )
    .addSubcommand(sub2 =>
      sub2
        .setName('interested')
        .setDescription('Indicates that your guild is INTERESTED in this recruit.')
        .addStringOption(option =>
          option
            .setName('guild')
            .setDescription('The guild that is interested in this recruit.')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option.setName('override').setDescription('Whether to override a previous decision for a guild.')
        )
    )
    .addSubcommand(sub3 =>
      sub3
        .setName('pass')
        .setDescription('Indicates that your guild is PASSING on this recruit.')
        .addStringOption(option =>
          option
            .setName('guild')
            .setDescription('The guild that is passing on this recruit.')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('comments').setDescription('Comments on why your guild is passing on a recruit.')
        )
        .addBooleanOption(option =>
          option.setName('override').setDescription('Whether to override a previous decision for a guild.')
        )
    )
    .addSubcommand(sub4 =>
      sub4
        .setName('nexttier')
        .setDescription('Moves a recruit to the next recruitment tier and pings the appropriate recruitment role.')
    )
    .addSubcommand(sub5 =>
      sub5
        .setName('close')
        .setDescription('Closes a recruitment thread for the specified reason.')
        .addStringOption(option =>
          option.setName('reason').setDescription('The reason the recruit thread is being closed.').setRequired(true)
        )
    )
    .addSubcommand(sub6 =>
      sub6
        .setName('claim')
        .setDescription('Claim a recruit for the specified guild, grant them roles, and close the thread.')
        .addStringOption(option =>
          option
            .setName('guild')
            .setDescription('The guild that is claiming the recruit.')
            .setAutocomplete(true)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if ((await interaction.options.getSubcommand()) === 'add') {
      const [discorduser, allycode, notes] = await Promise.all([
        interaction.options.getUser('discorduser'),
        interaction.options.getString('allycode'),
        interaction.options.getString('notes'),
      ]);

      // Parse the ally code, and return an error if the parse fails
      const parsedAllyCode = parseAllyCode(allycode);
      if (!parsedAllyCode) return interaction.editReply('Error parsing ally code. Please try again!');

      // Return an error if the guild is already registered
      if (await db.collection('recruits').countDocuments({ ally_code: parsedAllyCode }))
        return interaction.editReply(`A recruit thread for ally code ${parsedAllyCode} already exists!`);

      await interaction.editReply(
        `Creating recruit thread for ${discorduser.username} (Ally Code: ${parsedAllyCode}), please wait... `
      );

      // Fetch account information and determine starting tier based on account GP
      const playerData = await fetchHelp(parsedAllyCode);
      if (!playerData)
        return interaction.editReply('Unable to fetch account information. Please verify ally code and try again!');
      const gp = playerData.stats[0].value;
      const startingTier = await findStartingTier(gp);
      const tier = await db.collection('tiers').findOne({ number: startingTier });

      // Generate the account summary embeds
      const accountSummary = await generateAccountSummary(parsedAllyCode);

      // Create recruitment thread, and send the account summary embeds
      const recruitmentChannel = await interaction.client.channels.fetch(config.channels.recruitmentRoom);
      const thread = await recruitmentChannel.threads.create({
        name: `${discorduser.username} (T${startingTier})`,
        autoArchiveDuration: 10080,
      });
      await thread.join();
      const summaryMessage = await thread.send(accountSummary);

      // If notes were provided, send the notes embed in the thread
      if (notes) {
        const notesEmbed = await newEmbed()
          .setTitle('Recruitment Notes')
          .setDescription(notes)
          .setFooter({ text: '', iconURL: '' });
        const notesMessage = await thread.send({ embeds: [notesEmbed] });
        await notesMessage.pin();
      }

      const priorityMessage = await thread.send('Tier Priority:');

      // Add the recruit to the database
      await db.collection('recruits').insertOne({
        ally_code: parsedAllyCode,
        discord_name: discorduser.username,
        discord_user_id: discorduser.id,
        tier: startingTier,
        thread_id: thread.id,
        priority_message_id: priorityMessage.id,
      });

      // Generate the priority list for the recruit's starting tier and send it in the thread
      const priorityEmbed = await generateTierPriority(parsedAllyCode);
      await priorityMessage.edit(priorityEmbed);

      await summaryMessage.pin();
      await priorityMessage.pin();

      // Ping the starting tier's recruitment role in the thread
      await thread.send(roleMention(tier.recruiter_role_id));

      // Success message
      return interaction.editReply(`Recruit thread for ${discorduser.username} has been created.`);
    }

    if ((await interaction.options.getSubcommand()) === 'linkthread') {
      if (!interaction.channel.isThread()) return interaction.editReply('Please use this command in a recruit thread.');
      const [discorduser, allycode, notes] = await Promise.all([
        interaction.options.getUser('discorduser'),
        interaction.options.getString('allycode'),
        interaction.options.getString('notes'),
      ]);

      // Parse the ally code, and return an error if the parse fails
      const parsedAllyCode = parseAllyCode(allycode);
      if (!parsedAllyCode) return interaction.editReply('Error parsing ally code. Please try again!');

      // Return an error if the guild is already registered
      if (await db.collection('recruits').countDocuments({ ally_code: parsedAllyCode }))
        return interaction.editReply(`A recruit thread for ally code ${parsedAllyCode} already exists!`);

      await interaction.editReply(
        `Linking this recruitment thread to Discord user ${discorduser.username} (Ally Code: ${parsedAllyCode}), please wait... `
      );

      // Fetch account information and determine starting tier based on account GP
      const playerData = await fetchHelp(parsedAllyCode);
      if (!playerData)
        return interaction.editReply('Unable to fetch account information. Please verify ally code and try again!');
      const gp = playerData.stats[0].value;
      const startingTier = await findStartingTier(gp);
      const tier = await db.collection('tiers').findOne({ number: startingTier });

      // Generate the account summary embeds
      const accountSummary = await generateAccountSummary(parsedAllyCode);

      // Create recruitment thread, and send the account summary embeds
      const thread = interaction.channel;
      await thread.join();
      await thread.edit({
        name: `${discorduser.username} (T${startingTier})`,
      });
      const summaryMessage = await thread.send(accountSummary);

      // If notes were provided, send the notes embed in the thread
      if (notes) {
        const notesEmbed = await newEmbed()
          .setTitle('Recruitment Notes')
          .setDescription(notes)
          .setFooter({ text: '', iconURL: '' });
        const notesMessage = await thread.send({ embeds: [notesEmbed] });
        await notesMessage.pin();
      }

      const priorityMessage = await thread.send('Tier Priority:');

      // Add the recruit to the database
      await db.collection('recruits').insertOne({
        ally_code: parsedAllyCode,
        discord_name: discorduser.username,
        discord_user_id: discorduser.id,
        tier: startingTier,
        thread_id: thread.id,
        priority_message_id: priorityMessage.id,
      });

      // Generate the priority list for the recruit's starting tier and send it in the thread
      const priorityEmbed = await generateTierPriority(parsedAllyCode);
      await priorityMessage.edit(priorityEmbed);
      await summaryMessage.pin();
      await priorityMessage.pin();

      // Ping the starting tier's recruitment role in the thread
      await thread.send(roleMention(tier.recruiter_role_id));

      // Success message
      return interaction.editReply(
        `Recruit thread successfully linked to Discord user ${discorduser.username}. Recruit commands may now be used in this thread!`
      );
    }

    // The below commands should all be used inside a recruitment thread.
    const recruit = await db.collection('recruits').findOne({ thread_id: interaction.channel.id });
    if (!recruit) return interaction.editReply('Please use this command in an active recruit thread.');

    if ((await interaction.options.getSubcommand()) === 'interested') {
      // Validate that the guild exists, the guild selected is in the correct tier, and the user is a recruiter for the guild
      const guild = await interaction.options.getString('guild');
      const guildResult = await db.collection('guilds').findOne({ name: guild });
      if (!guildResult)
        return interaction.editReply(
          'A guild with that name was not found. Please select a guild name from the auto-complete list and try again!'
        );
      if (recruit.tier !== guildResult.tier)
        return interaction.editReply(`Decisions for this recruit are only open to guilds in Tier ${recruit.tier}.`);
      if (!interaction.member.roles.cache.has(guildResult.recruiter_role_id))
        return interaction.editReply(`You must have the ${guild} Recruiter role to enter decisions for ${guild}.`);

      // If no decision has been entered for the guild, enter the decision and update the priority list
      const decisionResult = await db.collection('decisions').findOne({ ally_code: recruit.ally_code, guild: guild });
      if (!decisionResult) {
        await db.collection('decisions').insertOne({
          ally_code: recruit.ally_code,
          guild: guild,
          decision: 'Interested',
          entered_by: interaction.member.id,
        });
        const priorityMessage = await interaction.channel.messages.fetch(recruit.priority_message_id);
        const updatedTierPriority = await generateTierPriority(recruit.ally_code);
        await priorityMessage.edit(updatedTierPriority);
        // Announce guild's decision in the thread
        await interaction.channel.send(`${guild} is __INTERESTED__ in this recruit. (Entered by ${interaction.member})`);
        return await interaction.editReply('Decision entered.');
      }

      // If the decision was the same as already entered, return an error
      if (decisionResult.decision === 'Interested')
        return interaction.editReply(
          `${guild} was already Interested in this recruit. Did you mean to change your guild's decision?`
        );

      // If a different decision was already entered, ask the user to override
      if (decisionResult.decision === 'Pass' && (await !interaction.options.getBoolean('override'))) {
        return interaction.editReply(
          `A decision of PASS was already entered for ${guild} by ${userMention(
            decisionResult.entered_by
          )}. To override this decision, please repeat this command with the override option set to True.`
        );
      }

      // If override was provided, change the decision and update the priority list
      await db
        .collection('decisions')
        .updateOne(
          { ally_code: recruit.ally_code, guild: guild },
          { $set: { decision: 'Interested', entered_by: interaction.member.id } }
        );

      const priorityMessage = await interaction.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      // Announce guild's decision in the thread
      await interaction.channel.send(`${guild}'s decision changed from PASS to __INTERESTED__.`);
      return await interaction.editReply('Decision entered.');
    }

    if ((await interaction.options.getSubcommand()) === 'pass') {
      // Validate that the guild exists, the guild selected is in the correct tier, and the user is a recruiter for the guild
      const guild = await interaction.options.getString('guild');
      const comments = await interaction.options.getString('comments');
      const guildResult = await db.collection('guilds').findOne({ name: guild });
      if (!guildResult)
        return interaction.editReply(
          'A guild with that name was not found. Please select a guild name from the auto-complete list and try again!'
        );
      if (recruit.tier !== guildResult.tier)
        return interaction.editReply(`Decisions for this recruit are only open to guilds in Tier ${recruit.tier}.`);
      if (!interaction.member.roles.cache.has(guildResult.recruiter_role_id))
        return interaction.editReply(`You must have the ${guild} Recruiter role to enter decisions for ${guild}.`);

      // If no decision has been entered for the guild, enter the decision and update the priority list
      const decisionResult = await db.collection('decisions').findOne({ ally_code: recruit.ally_code, guild: guild });
      if (!decisionResult) {
        await db.collection('decisions').insertOne({
          ally_code: recruit.ally_code,
          guild: guild,
          decision: 'Pass',
          entered_by: interaction.member.id,
        });
        const priorityMessage = await interaction.channel.messages.fetch(recruit.priority_message_id);
        const updatedTierPriority = await generateTierPriority(recruit.ally_code);
        await priorityMessage.edit(updatedTierPriority);
        // Announce guild's decision in the thread
        await interaction.channel.send(
          `${guild} __PASSES__ on this recruit. (Entered by ${interaction.member}${
            comments ? ` Comments: ${comments}` : ''
          })`
        );
        return await interaction.editReply('Decision entered.');
      }

      // If the decision was the same as already entered, return an error
      if (decisionResult.decision === 'Pass')
        return interaction.editReply(
          `${guild} already passed on this recruit. Did you mean to change your guild's decision?`
        );

      // If a different decision was already entered, ask the user to override
      if (decisionResult.decision === 'Interested' && (await !interaction.options.getBoolean('override'))) {
        return interaction.editReply(
          `A decision of INTERESTED was already entered for ${guild} by ${userMention(
            decisionResult.entered_by
          )}. To override this decision, please repeat this command with the override option set to True.`
        );
      }

      // If override was provided, change the decision and update the priority list
      await db
        .collection('decisions')
        .updateOne(
          { ally_code: recruit.ally_code, guild: guild },
          { $set: { decision: 'Pass', entered_by: interaction.member.id } }
        );

      const priorityMessage = await interaction.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      // Announce guild's decision in the thread
      await interaction.channel.send(
        `${guild}'s decision changed from INTERESTED to __PASS__. (Entered by ${interaction.member})`
      );
      return await interaction.editReply('Decision entered.');
    }

    if ((await interaction.options.getSubcommand()) === 'nexttier') {
      // Command is invalid if recruit is already in tier 1
      if (recruit.tier === 1) return interaction.editReply('This recruit is already in Tier 1, the lowest available tier.');

      // Update the recruit's tier in the database
      await db.collection('recruits').updateOne({ thread_id: interaction.channel.id }, { $set: { tier: recruit.tier - 1 } });

      // Update the priority with the next tier's priority list, and change the name to reflect the new tier
      const priorityMessage = await interaction.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      await interaction.channel.edit({ name: `${recruit.discord_name} (T${recruit.tier - 1})` });

      // Ping the new recruitment tier in the thread
      const tier = await db.collection('tiers').findOne({ number: recruit.tier - 1 });
      await interaction.channel.send(
        `This recruit has been moved to ${roleMention(tier.recruiter_role_id)} by ${interaction.member}`
      );

      // Success message
      return await interaction.editReply('Tier changed.');
    }

    if ((await interaction.options.getSubcommand()) === 'close') {
      const reason = await interaction.options.getString('reason');
      await interaction.editReply('Closing thread.');

      // Announce thread closure
      await interaction.channel.send(`Thread closed by ${interaction.member} for the following reason: "${reason}".`);

      await db.collection('recruits').findOneAndDelete({ thread_id: interaction.channel.id });
      await db.collection('decisions').deleteMany({ ally_code: recruit.ally_code });
      await interaction.channel.setLocked(true);
      await interaction.channel.setArchived(true);
    }

    if ((await interaction.options.getSubcommand()) === 'claim') {
      const guild = await interaction.options.getString('guild');

      // Validate that the guild exists, is in the appropriate tier, and the command user is a recruiter for the guild
      const guildResult = await db.collection('guilds').findOne({ name: guild });
      if (!guildResult)
        return interaction.editReply(
          'A guild with that name was not found. Please select a guild name from the auto-complete list and try again!'
        );
      if (recruit.tier !== guildResult.tier)
        return interaction.editReply(`Actions for this recruit are only open to guilds in Tier ${recruit.tier}.`);
      if (!interaction.member.roles.cache.has(guildResult.recruiter_role_id))
        return interaction.editReply(`You must have the ${guild} Recruiter role to claim recruits for ${guild}.`);

      await interaction.editReply(`Claiming this recruit for ${guild}!`);

      // Set the recruit's roles
      const user = await interaction.guild.members.fetch(recruit.discord_user_id);
      await user.roles.add(await interaction.guild.roles.fetch(guildResult.member_role_id));
      await user.roles.add(await interaction.guild.roles.fetch(config.roles.senateCitizen));
      await user.roles.remove(await interaction.guild.roles.fetch(config.roles.potentialGuildMember));

      // Announce that the recruit has been claimed, change the thread name, and update the guild's last recruit information
      await interaction.channel.send(
        `${guild} has claimed this recruit! Archiving recruit thread... (Claimed by ${interaction.member})`
      );
      await interaction.channel.edit({ name: `${recruit.discord_name} T${recruit.tier} (Joined ${guild})` });
      await db.collection('guilds').updateOne(
        { name: guild },
        {
          $set: {
            last_recruit_name: recruit.discord_name,
            last_recruit_time: Date.now(),
          },
        }
      );

      await db.collection('recruits').findOneAndDelete({ ally_code: recruit.ally_code });
      await db.collection('decisions').deleteMany({ ally_code: recruit.ally_code });
      await interaction.channel.setLocked(true);
      await interaction.channel.setArchived(true);
    }
  },
};
