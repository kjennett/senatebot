const parseAllyCode = require('../api/parseAllyCode');
const fetchGgAccountData = require('../api/fetchGgAccountData');
const config = require('../config');
const generateAccountSummary = require('../account/generateAccountSummary');
const generateTierPriority = require('../recruitment/generateTierPriority');
const { db } = require('../database');
const { EmbedBuilder, SlashCommandBuilder, roleMention, userMention } = require('discord.js');

async function findStartingTier(gp) {
  const result = await db.collection('tiers').findOne({
    maximum_gp: { $gte: gp },
    minimum_gp: { $lte: gp },
  });
  return result.number;
}

module.exports = {
  enabled: true,

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

  async execute(i) {
    await i.deferReply({ ephemeral: true });
    const sub = await i.options.getSubcommand();

    if (sub === 'add') {
      // ---------- Fetch User Inputs ---------- //
      const [discorduser, allycode, notes] = await Promise.all([
        i.options.getUser('discorduser'),
        i.options.getString('allycode'),
        i.options.getString('notes'),
      ]);

      // ---------- Determine Ally Code ---------- //
      const parsedAllyCode = await parseAllyCode(allycode);
      if (!parsedAllyCode)
        return i.editReply(`Unable to determine ally code using the provided input: (${i.options.getString('allycode')})`);

      // ---------- Check Recruit Thread Database ---------- //
      if (await db.collection('recruits').countDocuments({ ally_code: parsedAllyCode }))
        return i.editReply(`A recruitment thread already exists for this ally code.`);

      // ---------- Fetch Account Data ---------- //
      const ggData = await fetchGgAccountData(parsedAllyCode);
      if (!ggData)
        return i.editReply(
          `Unable to find SWGOH.GG data for ally code ${parsedAllyCode}. Please scan this ally code to add the account to SWGOH.GG: https://swgoh.gg/scan-player/`
        );

      // ---------- Find Starting Recruitment Tier ---------- //
      const startingTier = await findStartingTier(ggData.data.galactic_power);
      const tier = await db.collection('tiers').findOne({ number: startingTier });

      // ---------- Generate Account Summary ---------- //
      const accountSummary = await generateAccountSummary(ggData);

      // ---------- Start Recruitment Thread ---------- //
      const recruitmentChannel = await i.client.channels.fetch(config.channels.recruitmentRoom);
      const thread = await recruitmentChannel.threads.create({
        name: `${discorduser.username} (T${startingTier})`,
        autoArchiveDuration: 10080,
      });
      await thread.join();
      await thread.send(accountSummary);
      if (notes) {
        const notesEmbed = new EmbedBuilder().setTitle('Recruitment Notes').setDescription(notes);
        await thread.send({ embeds: [notesEmbed] });
      }
      const priorityMessage = await thread.send('Tier Priority:');

      // ---------- Add Recruit Thread to Database ---------- //
      await db.collection('recruits').insertOne({
        ally_code: parsedAllyCode,
        discord_name: discorduser.username,
        discord_user_id: discorduser.id,
        tier: startingTier,
        thread_id: thread.id,
        priority_message_id: priorityMessage.id,
      });

      // ---------- Display Tier Priority ---------- //
      const priorityEmbed = await generateTierPriority(parsedAllyCode);
      await priorityMessage.edit(priorityEmbed);

      await thread.send(roleMention(tier.recruiter_role_id));
      return i.editReply(`Recruit thread for ${discorduser.username} has been created.`);
    }

    if (sub === 'linkthread') {
      if (!i.channel.isThread()) return i.editReply('Please use this command in a recruit thread.');

      // ---------- Fetch User Inputs ---------- //
      const [discorduser, allycode, notes] = await Promise.all([
        i.options.getUser('discorduser'),
        i.options.getString('allycode'),
        i.options.getString('notes'),
      ]);

      // ---------- Determine Ally Code ---------- //
      const parsedAllyCode = await parseAllyCode(allycode);
      if (!parsedAllyCode)
        return i.editReply(`Unable to determine ally code using the provided input: (${i.options.getString('allycode')})`);

      // ---------- Check Recruit Thread Database ---------- //
      if (await db.collection('recruits').countDocuments({ ally_code: parsedAllyCode }))
        return i.editReply(`A recruitment thread already exists for this ally code.`);

      // ---------- Fetch Account Data ---------- //
      const ggData = await fetchGgAccountData(parsedAllyCode);
      if (!ggData)
        return i.editReply(
          `Unable to find SWGOH.GG data for ally code ${parsedAllyCode}. Please scan this ally code to add the account to SWGOH.GG: https://swgoh.gg/scan-player/`
        );

      // ---------- Find Starting Recruitment Tier ---------- //
      const startingTier = await findStartingTier(ggData.data.galactic_power);
      const tier = await db.collection('tiers').findOne({ number: startingTier });

      // ---------- Generate Account Summary ---------- //
      const accountSummary = await generateAccountSummary(ggData);

      // ---------- Join Recruitment Thread ---------- //
      const thread = i.channel;
      await thread.join();
      await thread.edit({
        name: `${discorduser.username} (T${startingTier})`,
      });
      await thread.send(accountSummary);
      if (notes) {
        const notesEmbed = new EmbedBuilder().setTitle('Recruitment Notes').setDescription(notes);
        await thread.send({ embeds: [notesEmbed] });
      }
      const priorityMessage = await thread.send('Tier Priority:');

      // ---------- Add Recruitment Thread to Database ---------- //
      await db.collection('recruits').insertOne({
        ally_code: parsedAllyCode,
        discord_name: discorduser.username,
        discord_user_id: discorduser.id,
        tier: startingTier,
        thread_id: thread.id,
        priority_message_id: priorityMessage.id,
      });

      // ---------- Display Tier Priority ---------- //
      const priorityEmbed = await generateTierPriority(parsedAllyCode);
      await priorityMessage.edit(priorityEmbed);

      await thread.send(roleMention(tier.recruiter_role_id));
      return i.editReply(`Recruit thread successfully linked. Recruit commands may now be used in this thread!`);
    }

    // TODO: Look at all the commands below this and optimize
    // ---------- Thread Check ---------- //
    const recruit = await db.collection('recruits').findOne({ thread_id: i.channel.id });
    if (!recruit) return i.editReply('Please use this command in an active recruit thread.');

    if (sub === 'interested') {
      const guild = await i.options.getString('guild');
      const guildResult = await db.collection('guilds').findOne({ name: guild });
      if (!guildResult)
        return i.editReply(
          'A guild with that name was not found. Please select a guild name from the auto-complete list and try again!'
        );
      if (recruit.tier !== guildResult.tier)
        return i.editReply(`Decisions for this recruit are only open to guilds in Tier ${recruit.tier}.`);
      if (!i.member.roles.cache.has(guildResult.recruiter_role_id))
        return i.editReply(`You must have the ${guild} Recruiter role to enter decisions for ${guild}.`);

      const decisionResult = await db.collection('decisions').findOne({
        ally_code: recruit.ally_code,
        guild: guild,
      });
      if (!decisionResult) {
        await db.collection('decisions').insertOne({
          ally_code: recruit.ally_code,
          guild: guild,
          decision: 'Interested',
          entered_by: i.member.id,
        });
        const priorityMessage = await i.channel.messages.fetch(recruit.priority_message_id);
        const updatedTierPriority = await generateTierPriority(recruit.ally_code);
        await priorityMessage.edit(updatedTierPriority);
        await i.channel.send(`${guild} is __INTERESTED__ in this recruit. (Entered by ${i.member})`);
        return await i.editReply('Decision entered.');
      }

      if (decisionResult.decision === 'Interested')
        return i.editReply(`${guild} was already Interested in this recruit. Did you mean to change your guild's decision?`);

      if (decisionResult.decision === 'Pass' && (await !i.options.getBoolean('override'))) {
        return i.editReply(
          `A decision of PASS was already entered for ${guild} by ${userMention(
            decisionResult.entered_by
          )}. To override this decision, please repeat this command with the override option set to True.`
        );
      }

      await db
        .collection('decisions')
        .updateOne(
          { ally_code: recruit.ally_code, guild: guild },
          { $set: { decision: 'Interested', entered_by: i.member.id } }
        );

      const priorityMessage = await i.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      await i.channel.send(`${guild}'s decision changed from PASS to __INTERESTED__.`);
      return await i.editReply('Decision entered.');
    }

    // ---------- RECRUIT PASS ---------- //

    if (sub === 'pass') {
      const guild = await i.options.getString('guild');
      const comments = await i.options.getString('comments');
      const guildResult = await db.collection('guilds').findOne({ name: guild });
      if (!guildResult)
        return i.editReply(
          'A guild with that name was not found. Please select a guild name from the auto-complete list and try again!'
        );
      if (recruit.tier !== guildResult.tier)
        return i.editReply(`Decisions for this recruit are only open to guilds in Tier ${recruit.tier}.`);
      if (!i.member.roles.cache.has(guildResult.recruiter_role_id))
        return i.editReply(`You must have the ${guild} Recruiter role to enter decisions for ${guild}.`);

      const decisionResult = await db.collection('decisions').findOne({
        ally_code: recruit.ally_code,
        guild: guild,
      });
      if (!decisionResult) {
        await db.collection('decisions').insertOne({
          ally_code: recruit.ally_code,
          guild: guild,
          decision: 'Pass',
          entered_by: i.member.id,
        });
        const priorityMessage = await i.channel.messages.fetch(recruit.priority_message_id);
        const updatedTierPriority = await generateTierPriority(recruit.ally_code);
        await priorityMessage.edit(updatedTierPriority);
        await i.channel.send(
          `${guild} __PASSES__ on this recruit. (Entered by ${i.member}${comments ? ` Comments: ${comments}` : ''})`
        );
        return await i.editReply('Decision entered.');
      }

      if (decisionResult.decision === 'Pass')
        return i.editReply(`${guild} already passed on this recruit. Did you mean to change your guild's decision?`);

      if (decisionResult.decision === 'Interested' && (await !i.options.getBoolean('override'))) {
        return i.editReply(
          `A decision of INTERESTED was already entered for ${guild} by ${userMention(
            decisionResult.entered_by
          )}. To override this decision, please repeat this command with the override option set to True.`
        );
      }

      await db
        .collection('decisions')
        .updateOne({ ally_code: recruit.ally_code, guild: guild }, { $set: { decision: 'Pass', entered_by: i.member.id } });

      const priorityMessage = await i.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      await i.channel.send(`${guild}'s decision changed from INTERESTED to __PASS__. (Entered by ${i.member})`);
      return await i.editReply('Decision entered.');
    }

    if (sub === 'nexttier') {
      const newTier = await i.options.getInteger('tier');
      if (recruit.tier === 1 && !newTier)
        return i.editReply('This recruit is already in Tier 1, the lowest available tier.');

      await db.collection('decisions').deleteMany({ ally_code: recruit.ally_code });
      await db
        .collection('recruits')
        .updateOne({ thread_id: i.channel.id }, { $set: { tier: newTier ?? recruit.tier - 1 } });

      const priorityMessage = await i.channel.messages.fetch(recruit.priority_message_id);
      const updatedTierPriority = await generateTierPriority(recruit.ally_code);
      await priorityMessage.edit(updatedTierPriority);
      await i.channel.edit({
        name: `${recruit.discord_name} (T${newTier ?? recruit.tier - 1})`,
      });

      const tier = await db.collection('tiers').findOne({ number: newTier ?? recruit.tier - 1 });
      await i.channel.send(`This recruit has been moved to ${roleMention(tier.recruiter_role_id)} by ${i.member}`);

      return await i.editReply('Tier changed.');
    }

    // --------- RECRUIT CLOSE ---------- //

    if (sub === 'close') {
      const reason = await i.options.getString('reason');
      await i.editReply('Closing thread.');

      await i.channel.send(`Thread closed by ${i.member} for the following reason: "${reason}".`);

      await db.collection('recruits').findOneAndDelete({ thread_id: i.channel.id });
      await db.collection('decisions').deleteMany({ ally_code: recruit.ally_code });
      await i.channel.setLocked(true);
      await i.channel.setArchived(true);
    }

    // ---------- RECRUIT CLAIM ---------- //

    if (sub === 'claim') {
      const guild = await i.options.getString('guild');

      const guildResult = await db.collection('guilds').findOne({ name: guild });
      if (!guildResult)
        return i.editReply(
          'A guild with that name was not found. Please select a guild name from the auto-complete list and try again!'
        );
      if (recruit.tier !== guildResult.tier)
        return i.editReply(`Actions for this recruit are only open to guilds in Tier ${recruit.tier}.`);
      if (!i.member.roles.cache.has(guildResult.recruiter_role_id))
        return i.editReply(`You must have the ${guild} Recruiter role to claim recruits for ${guild}.`);

      await i.editReply(`Claiming this recruit for ${guild}!`);

      const user = await i.guild.members.fetch(recruit.discord_user_id);
      await user.roles.add(await i.guild.roles.fetch(guildResult.member_role_id));
      await user.roles.add(await i.guild.roles.fetch(config.roles.senateCitizen));
      await user.roles.remove(await i.guild.roles.fetch(config.roles.potentialGuildMember));

      await i.channel.send(`${guild} has claimed this recruit! Archiving recruit thread... (Claimed by ${i.member})`);
      await i.channel.edit({
        name: `${recruit.discord_name} T${recruit.tier} (Joined ${guild})`,
      });
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
      await i.channel.setLocked(true);
      await i.channel.setArchived(true);
    }
  },
};
