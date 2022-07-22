const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('@discordjs/builders');
const { db } = require('../database');
const { config } = require('../config');
const { writeFileSync, unlinkSync } = require('fs');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const { fetchHelp } = require('../functions/fetchPlayerData');
const { generateAccountSummary } = require('../functions/generateAccountSummary');
const { generateTierPriority } = require('../functions/generateTierPriority');

const restartSubcommand = new SlashCommandSubcommandBuilder()
  .setName('restart')
  .setDescription('Exits the process to force-restart SenateBot.');

const welcomeTestSubcommand = new SlashCommandSubcommandBuilder()
  .setName('welcometest')
  .setDescription('Simulates a new member entering the server.');

const leaveTestSubcommand = new SlashCommandSubcommandBuilder()
  .setName('leavetest')
  .setDescription('Simulates a member leaving the server.');

const updatePrioritySubcommand = new SlashCommandSubcommandBuilder()
  .setName('updatepriority')
  .setDescription("Updates a guild's recruitment time in the database.")
  .addStringOption(option =>
    option.setName('guild').setDescription('The guild who claimed the recruit.').setAutocomplete(true).setRequired(true)
  )
  .addStringOption(option =>
    option.setName('name').setDescription('The name of the recruit that was claimed.').setRequired(true)
  )
  .addStringOption(option =>
    option.setName('time').setDescription('The aproximate time the recruit was claimed, as a millisecond timestamp')
  );

const order66Subcommand = new SlashCommandSubcommandBuilder()
  .setName('order66')
  .setDescription('Show a list of server members that meet purge criteria.')
  .addBooleanOption(option => option.setName('doit').setDescription('The time has come... Execute Order 66.'));

const testRecruitSubcommand = new SlashCommandSubcommandBuilder()
  .setName('testrecruit')
  .setDescription('Creates a mock recruitment thread without notifying recruiters.');

const twInfoSubcommand = new SlashCommandSubcommandBuilder()
  .setName('twinfo')
  .setDescription('Shows information about the current TW phase, if one is in progress.');

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
    .setName('config')
    .setDescription('Configuration and administration commands for SenateBot.')
    .addSubcommand(restartSubcommand)
    .addSubcommand(welcomeTestSubcommand)
    .addSubcommand(leaveTestSubcommand)
    .addSubcommand(updatePrioritySubcommand)
    .addSubcommand(order66Subcommand)
    .addSubcommand(testRecruitSubcommand)
    .addSubcommand(twInfoSubcommand),

  async execute(interaction) {
    if (interaction.member.id !== process.env.OWNER)
      return interaction.reply('This command is usable by the bot administrator only.');

    const sub = await interaction.options.getSubcommand();

    if (sub === 'restart') {
      const embed = new MessageEmbed({
        title: 'Restarting...',
        color: 'GREEN',
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      process.exit(1);
    }

    if (sub === 'testwelcome') return interaction.client.emit('guildMemberAdd', interaction.member);
    if (sub === 'testleave') return interaction.client.emit('guildMemberRemove', interaction.member);

    if (sub === 'updatepriority') {
      await interaction.deferReply({ ephemeral: true });

      const guild = await interaction.options.getString('guild');
      const name = await interaction.options.getString('name');
      const time = (await interaction.options.getString('time')) ?? Date.now();

      await db
        .collection('guilds')
        .findOneAndUpdate({ name: guild }, { $set: { last_recruit_name: name, last_recruit_time: time } });

      const embed = new MessageEmbed({
        title: 'Last Recruit Time Updated',
        description: `Guild: ${guild}\nRecruit: ${name}\ntime: <t:${Math.floor(time / 1000)}:f>`,
        color: 'GREEN',
      });
      await interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'order66') {
      await interaction.deferReply();

      const allMembers = await interaction.guild.members.fetch();
      const hasPGM = await allMembers.filter(m => m.roles.cache.has(config.roles.potentialGuildMember));
      const pgmOnly = await hasPGM.filter(m => m.roles.cache.size === 2);
      const purgeableMembers = pgmOnly.filter(m => m.joinedTimestamp < Date.now() - 12096e5);
      purgeableMembers.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);

      if (await !interaction.options.getBoolean('doit')) {
        const purgeList = [];
        purgeableMembers.forEach(m =>
          purgeList.push(`User: ${m.displayName} | Joined: ${new Date(m.joinedTimestamp).toLocaleDateString()}`)
        );

        if (purgeList.length) {
          const embed = new MessageEmbed({
            title: 'Purgeable Users',
            description: `The following ${purgeList.length} members:\n - __Only__ have the Potential Guild Member role\n - Joined the server more than 14 days ago\n - Do not have an active recruitment thread\n\nTo remove these users from the server, run this command again with the DOIT option set to True.`,
          });
          await writeFileSync('./purgelist.txt', purgeList.join('\n'));
          const fileAttachment = new MessageAttachment('./purgelist.txt');
          await interaction.editReply({
            embeds: [embed],
            files: [fileAttachment],
          });
          await unlinkSync('./purgelist.txt');
        } else {
          const embed = new MessageEmbed({
            title: 'No purge-eligible members were found.',
            color: 'RED',
          });
          return interaction.editReply({ embeds: [embed] });
        }
      } else {
        const purgedList = [];
        if (purgeableMembers.size) {
          purgeableMembers.forEach(async m => {
            try {
              await m.send(
                'You have been automatically removed from ΞTHE SENATEΞ Alliance Discord Server, as you have not been granted a role within 14 days of joining the server.\nIf you believe this to be in error, please rejoin the server using the following link:\n\nhttp://discord.thesenate.gg\n\nΞThe SenateΞ wishes you good fortune in your SWGOH adventures - may the Force be with you, always!'
              );
              await m.kick('Purged: 14 days without receiving a role.');
            } catch (e) {
              await m.kick('Purged: 14 days without receiving a role.');
            }

            await purgedList.push(`User: ${m.displayName} | Joined: ${new Date(m.joinedTimestamp).toLocaleDateString()}`);
          });

          await writeFileSync('./purgelist.txt', purgedList.join('\n'));
          const fileAttachment = new MessageAttachment('./purgelist.txt');

          const embed = new MessageEmbed({
            title: `Success - the following ${purgedList.length} users have been removed:`,
            color: 'GREEN',
          });
          await interaction.editReply('https://tenor.com/view/palpatine-star-wars-emperor-do-it-go-for-it-gif-17446081');
          await interaction.followUp({
            embeds: [embed],
            files: [fileAttachment],
          });

          await unlinkSync('./purgelist.txt');
        } else {
          const embed = new MessageEmbed({
            title: `No purge-eligible members were found.`,
            color: 'RED',
          });
          return interaction.editReply({ embeds: [embed] });
        }
      }
    }

    // ---------- CONFIG TESTRECRUIT ---------- //

    if (sub === 'testrecruit') {
      await interaction.reply('Creating test recruitment thread, please wait...');
      const parsedAllyCode = '136663451';

      if (await db.collection('recruits').countDocuments({ ally_code: parsedAllyCode }))
        return interaction.editReply(`A recruit thread for ally code ${parsedAllyCode} already exists!`);

      await interaction.editReply(`Creating recruit thread for Veritable Quandary (Ally Code: 136663451), please wait... `);

      const playerData = await fetchHelp(parsedAllyCode);
      if (!playerData)
        return interaction.editReply('Unable to fetch account information. Please verify ally code and try again!');
      const gp = playerData.stats[0].value;
      const startingTier = await findStartingTier(gp);

      const accountSummary = await generateAccountSummary(parsedAllyCode);

      const recruitmentChannel = await interaction.client.channels.fetch(config.channels.recruitmentRoom);
      const thread = await recruitmentChannel.threads.create({
        name: `TESTING`,
        autoArchiveDuration: 10080,
      });
      await thread.join();
      const summaryMessage = await thread.send(accountSummary);

      const priorityMessage = await thread.send('Tier Priority:');

      await db.collection('recruits').insertOne({
        ally_code: parsedAllyCode,
        discord_name: 'TESTING',
        discord_user_id: process.env.OWNER,
        tier: startingTier,
        thread_id: thread.id,
        priority_message_id: priorityMessage.id,
      });

      const priorityEmbed = await generateTierPriority(parsedAllyCode);
      await priorityMessage.edit(priorityEmbed);

      await summaryMessage.pin();
      await priorityMessage.pin();

      return interaction.editReply(`Test recruitment thread has been created.`);
    }

    // ---------- CONFIG TWINFO ---------- //

    if (sub === 'twinfo') {
      await interaction.deferReply({ ephemeral: true });
      const currentPhase = await db
        .collection('warphases')
        .findOne({ start: { $lte: Date.now() }, end: { $gte: Date.now() } });
      if (!currentPhase) return interaction.editReply('A current TW phase is not in progress.');

      const embed = new MessageEmbed()
        .setTitle('Current TW Phase:')
        .setDescription(currentPhase.event)
        .addFields([
          {
            name: 'Phase:',
            value: `${currentPhase.name}`,
          },
          {
            name: 'Start:',
            value: `<t:${Math.floor(currentPhase.start) / 1000}:f>`,
          },
          {
            name: 'End:',
            value: `<t:${Math.floor(currentPhase.end) / 1000}:f>`,
          },
        ]);

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
