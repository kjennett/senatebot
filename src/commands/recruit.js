const { SlashCommandBuilder, roleMention, userMention } = require('@discordjs/builders');
const { parseAllyCode } = require('../functions/parseAllyCode');
const { config } = require('../config');
const { fetchHelp } = require('../functions/fetchPlayerData');
const { generateAccountSummary } = require('../functions/generateAccountSummary');
const { generateTierPriority } = require('../functions/generateTierPriority');
const { db } = require('../database');
const { MessageEmbed } = require('discord.js');

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
        .addIntegerOption(option =>
          option.setName('tier').setDescription('The tier to move the recruit to.').setAutocomplete(true)
        )
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
    const sub = await interaction.options.getSubcommand();

    // ---------- RECRUIT ADD ---------- //

    if (sub === 'add') {
      const [discorduser, allycode, notes] = await Promise.all([
        interaction.options.getUser('discorduser'),
        interaction.options.getString('allycode'),
        interaction.options.getString('notes'),
      ]);

      const parsedAllyCode = parseAllyCode(allycode);
      if (parsedAllyCode instanceof Error) return interaction.editReply(parsedAllyCode.message);

      if (await db.collection('recruits').countDocuments({ ally_code: parsedAllyCode }))
        return interaction.editReply(`This ally code is already registered for recruitment!`);

      const playerData = await fetchHelp(parsedAllyCode);
      if (!playerData)
        return interaction.editReply('Unable to fetch account information. Please verify ally code and try again!');
      const gp = playerData.stats[0].value;
      const startingTier = await findStartingTier(gp);
      const tier = await db.collection('tiers').findOne({ number: startingTier });

      const accountSummary = await generateAccountSummary(parsedAllyCode);

      const recruitmentChannel = await interaction.client.channels.fetch(config.channels.recruitmentRoom);
      const thread = await recruitmentChannel.threads.create({
        name: `${discorduser.username} (T${startingTier})`,
        autoArchiveDuration: 10080,
      });
      await thread.join();
      const summaryMessage = await thread.send(accountSummary);

      if (notes) {
        const notesEmbed = new MessageEmbed()
          .setTitle('Recruitment Notes')
          .setDescription(notes)
          .setFooter({ text: '', iconURL: '' });
        const notesMessage = await thread.send({ embeds: [notesEmbed] });
        await notesMessage.pin();
      }

      const priorityMessage = await thread.send('Tier Priority:');

      await db.collection('recruits').insertOne({
        ally_code: parsedAllyCode,
        discord_name: discorduser.username,
        discord_user_id: discorduser.id,
        tier: startingTier,
        thread_id: thread.id,
        priority_message_id: priorityMessage.id,
      });

      const priorityEmbed = await generateTierPriority(parsedAllyCode);
      await priorityMessage.edit(priorityEmbed);

      await summaryMessage.pin();
      await priorityMessage.pin();

      await thread.send(roleMention(tier.recruiter_role_id));

      return interaction.editReply(`Recruit thread for ${discorduser.username} has been created.`);
    }

    // ---------- RECRUIT LINKTHREAD ---------- //

    if (sub === 'linkthread') {
      if (!interaction.channel.isThread()) return interaction.editReply('Please use this command in a recruit thread.');
      const [discorduser, allycode, notes] = await Promise.all([
        interaction.options.getUser('discorduser'),
        interaction.options.getString('allycode'),
        interaction.options.getString('notes'),
      ]);

      const parsedAllyCode = parseAllyCode(allycode);
      if (!parsedAllyCode) return interaction.editReply('Error parsing ally code. Please try again!');

      if (await db.collection('recruits').countDocuments({ ally_code: parsedAllyCode }))
        return interaction.editReply(`A recruit thread for ally code ${parsedAllyCode} already exists!`);

      await interaction.editReply(
        `Linking this recruitment thread to Discord user ${discorduser.username} (Ally Code: ${parsedAllyCode}), please wait... `
      );

      const playerData = await fetchHelp(parsedAllyCode);
      if (!playerData)
        return interaction.editReply('Unable to fetch account information. Please verify ally code and try again!');
      const gp = playerData.stats[0].value;
      const startingTier = await findStartingTier(gp);
      const tier = await db.collection('tiers').findOne({ number: startingTier });

      const accountSummary = await generateAccountSummary(parsedAllyCode);

      const thread = interaction.channel;
      await thread.join();
      await thread.edit({
        name: `${discorduser.username} (T${startingTier})`,
      });
      const summaryMessage = await thread.send(accountSummary);

      if (notes) {
        const notesEmbed = new MessageEmbed()
          .setTitle('Recruitment Notes')
          .setDescription(notes)
          .setFooter({ text: '', iconURL: '' });
        const notesMessage = await thread.send({ embeds: [notesEmbed] });
        await notesMessage.pin();
      }

      const priorityMessage = await thread.send('Tier Priority:');

      await db.collection('recruits').insertOne({
        ally_code: parsedAllyCode,
        discord_name: discorduser.username,
        discord_user_id: discorduser.id,
        tier: startingTier,
        thread_id: thread.id,
        priority_message_id: priorityMessage.id,
      });

      const priorityEmbed = await generateTierPriority(parsedAllyCode);
      await priorityMessage.edit(priorityEmbed);
      await summaryMessage.pin();
      await priorityMessage.pin();

      await thread.send(roleMention(tier.recruiter_role_id));

      return interaction.editReply(
        `Recruit thread successfully linked to Discord user ${discorduser.username}. Recruit commands may now be used in this thread!`
      );
    }

    const recruit = await db.collection('recruits').findOne({ thread_id: interaction.channel.id });
    if (!recruit) return interaction.editReply('Please use this command in an active recruit thread.');

    // ---------- RECRUIT INTERESTED ---------- //

    if (sub === 'interested') {
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
        await interaction.channel.send(`${guild} is __INTERESTED__ in this recruit. (Entered by ${interaction.member})`);
        return await interaction.editReply('Decision entered.');
      }

      if (decisionResult.decision === 'Interested')
        return interaction.editReply(
          `${guild} was already Interested in this recruit. Did you mean to change your guild's decision?`
        );

      if (decisionResult.decision === 'Pass' && (await !interaction.options.getBoolean('override'))) {
        return interaction.editReply(
          `A decision of PASS was already entered for ${guild} by ${userMention(
            decisionResult.entered_by
          )}. To override this decision, please repeat this command with the override option set to True.`
        );
      }

      await db
        .collection('decisions')
        .updateOne(
          { ally_code: recruit.ally_code, guild: guild },
          { $set: { decision: 'Interested', entered_by: interaction.member.id } }
        );

      const priorityMessage = await interaction.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      await interaction.channel.send(`${guild}'s decision changed from PASS to __INTERESTED__.`);
      return await interaction.editReply('Decision entered.');
    }

    // ---------- RECRUIT PASS ---------- //

    if (sub === 'pass') {
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
        await interaction.channel.send(
          `${guild} __PASSES__ on this recruit. (Entered by ${interaction.member}${
            comments ? ` Comments: ${comments}` : ''
          })`
        );
        return await interaction.editReply('Decision entered.');
      }

      if (decisionResult.decision === 'Pass')
        return interaction.editReply(
          `${guild} already passed on this recruit. Did you mean to change your guild's decision?`
        );

      if (decisionResult.decision === 'Interested' && (await !interaction.options.getBoolean('override'))) {
        return interaction.editReply(
          `A decision of INTERESTED was already entered for ${guild} by ${userMention(
            decisionResult.entered_by
          )}. To override this decision, please repeat this command with the override option set to True.`
        );
      }

      await db
        .collection('decisions')
        .updateOne(
          { ally_code: recruit.ally_code, guild: guild },
          { $set: { decision: 'Pass', entered_by: interaction.member.id } }
        );

      const priorityMessage = await interaction.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      await interaction.channel.send(
        `${guild}'s decision changed from INTERESTED to __PASS__. (Entered by ${interaction.member})`
      );
      return await interaction.editReply('Decision entered.');
    }

    // ---------- RECRUIT NEXTTIER ---------- //

    if (sub === 'nexttier') {
      const newTier = await interaction.options.getInteger('tier');
      if (recruit.tier === 1 && !newTier)
        return interaction.editReply('This recruit is already in Tier 1, the lowest available tier.');

      const numberOfGuilds = await db.collection('guilds').countDocuments({ tier: recruit.tier });
      const numberOfDecisions = await db.collection('decisions').countDocuments({ ally_code: recruit.ally_code });
      if (numberOfGuilds !== numberOfDecisions)
        return interaction.editReply('All guilds in this tier must enter a decision before the tier can be changed.');

      await db.collection('decisions').deleteMany({ ally_code: recruit.ally_code });
      await db
        .collection('recruits')
        .updateOne({ thread_id: interaction.channel.id }, { $set: { tier: newTier ?? recruit.tier - 1 } });

      const priorityMessage = await interaction.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      await interaction.channel.edit({ name: `${recruit.discord_name} (T${newTier ?? recruit.tier - 1})` });

      const tier = await db.collection('tiers').findOne({ number: newTier ?? recruit.tier - 1 });
      await interaction.channel.send(
        `This recruit has been moved to ${roleMention(tier.recruiter_role_id)} by ${interaction.member}`
      );

      return await interaction.editReply('Tier changed.');
    }

    // --------- RECRUIT CLOSE ---------- //

    if (sub === 'close') {
      const reason = await interaction.options.getString('reason');
      await interaction.editReply('Closing thread.');

      await interaction.channel.send(`Thread closed by ${interaction.member} for the following reason: "${reason}".`);

      await db.collection('recruits').findOneAndDelete({ thread_id: interaction.channel.id });
      await db.collection('decisions').deleteMany({ ally_code: recruit.ally_code });
      await interaction.channel.setLocked(true);
      await interaction.channel.setArchived(true);
    }

    // ---------- RECRUIT CLAIM ---------- //

    if (sub === 'claim') {
      const guild = await interaction.options.getString('guild');

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

      const user = await interaction.guild.members.fetch(recruit.discord_user_id);
      await user.roles.add(await interaction.guild.roles.fetch(guildResult.member_role_id));
      await user.roles.add(await interaction.guild.roles.fetch(config.roles.senateCitizen));
      await user.roles.remove(await interaction.guild.roles.fetch(config.roles.potentialGuildMember));

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
