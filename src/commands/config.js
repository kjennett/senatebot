const { SlashCommandBuilder } = require('@discordjs/builders');
const { db } = require('../database');
const { config } = require('../config');
const { writeFileSync, unlinkSync } = require('fs');
const { MessageAttachment } = require('discord.js');
const { fetchHelp } = require('../functions/fetchPlayerData');
const { generateAccountSummary } = require('../functions/generateAccountSummary');
const { generateTierPriority } = require('../functions/generateTierPriority');
const { newEmbed } = require('../functions/newEmbed');

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
    .addSubcommand(sub => sub.setName('restart').setDescription('Force-restarts SenateBot.'))
    .addSubcommand(sub => sub.setName('testwelcome').setDescription('Tests welcome memu functionality.'))
    .addSubcommand(sub => sub.setName('testleave').setDescription('Tests member leave functionality.'))
    .addSubcommand(sub =>
      sub
        .setName('updatepriority')
        .setDescription("Updates a guild's recruitment time in the database.")
        .addStringOption(option =>
          option.setName('name').setDescription('The name of the recruit that was claimed.').setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('guild')
            .setDescription('The guild who claimed the recruit.')
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('order66')
        .setDescription('Show a list of inactive members who only have the PGM role')
        .addBooleanOption(option => option.setName('doit').setDescription('Execute order 66.'))
    )
    .addSubcommand(sub =>
      sub.setName('testrecruit').setDescription('Tests recruitment thread generation without pinging anyone.')
    )
    .addSubcommand(sub =>
      sub.setName('twinfo').setDescription('Shows information about the current TW phase, if one is in progress.')
    ),

  async execute(interaction) {
    if (interaction.member.id !== process.env.OWNER) {
      return interaction.reply('This command is enabled for the bot administrator only.');
    }

    const sub = await interaction.options.getSubcommand();

    // ---------- CONFIG RESTART ---------- //

    if (sub === 'restart') {
      await interaction.reply({ content: 'Restarting...', ephemeral: true });
      process.exit(1);
    }

    // ---------- CONFIG TESTWELCOME ---------- //
    // ---------- CONFIG TESTLEAVE ---------- //

    if (sub === 'testwelcome') return interaction.client.emit('guildMemberAdd', interaction.member);
    if (sub === 'testleave') return interaction.client.emit('guildMemberRemove', interaction.member);

    // ---------- CONFIG UPDATEPRIORITY ---------- //

    if (sub === 'updatepriority') {
      const guild = await interaction.options.getString('guild');
      const name = await interaction.options.getString('name');
      await db.collection('guilds').findOneAndUpdate(
        { name: guild },
        {
          $set: {
            last_recruit_name: name,
            last_recruit_time: Date.now(),
          },
        }
      );
      await interaction.reply({ content: `${guild}'s recruitment record was updated.`, ephemeral: true });
    }

    // ---------- CONFIG ORDER66 ---------- //

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
          await writeFileSync('./purgelist.txt', purgeList.join('\n'));
          const fileAttachment = new MessageAttachment('./purgelist.txt');
          await interaction.editReply({
            content: `The following *${purgeList.length} users*:\n\n1. __ONLY__ have the Potential Guild Member role,\n2. Joined the server more than 14 days ago, and\n3. Do not have an active recruitment thread.\n\nTo purge these users from the server, run the */config order66* command again with the *doit* option set to True.`,
            files: [fileAttachment],
          });
          await unlinkSync('./purgelist.txt');
        } else {
          await interaction.editReply(`No purgeable members were found.`);
        }
      } else {
        await interaction.editReply('Executing Order 66, please wait...');
        const purgedList = [];
        const failedList = [];
        if (purgeableMembers.size) {
          purgeableMembers.forEach(async m => {
            await purgedList.push(`User: ${m.displayName} | Joined: ${new Date(m.joinedTimestamp).toLocaleDateString()}`);

            try {
              await m.send(
                'You have been automatically removed from ΞTHE SENATEΞ Alliance Discord Server, as you have not been granted a role within 14 days of joining the server.\n If you believe this to be in error, please rejoin the server using the following link:\n\nhttp://discord.thesenate.gg\n\nΞThe SenateΞ wishes you good fortune in your SWGOH adventures - may the Force be with you, always!'
              );
            } catch (e) {
              await failedList.push(`User: ${m.displayName} | Joined: ${new Date(m.joinedTimestamp).toLocaleDateString()}`);
            }

            await m.kick('Purged: 14 days without receiving a role.');
          });

          await writeFileSync('./purgelist.txt', purgedList.join('\n'));
          await writeFileSync('./failedlist.txt', failedList.join('\n'));
          const fileAttachment = new MessageAttachment('./purgelist.txt');
          const fileAttachment2 = new MessageAttachment('./failedlist.txt');
          await interaction.editReply('https://tenor.com/view/palpatine-star-wars-emperor-do-it-go-for-it-gif-17446081');
          await interaction.followUp({
            content: `Order 66 is now complete - ${purgedList.length} users have been purged.`,
            files: [fileAttachment],
          });
          if (failedList.length)
            await interaction.followUp({
              content: `Failed to notify the following ${failedList.length} users of their removal:`,
              files: [fileAttachment2],
            });
          await unlinkSync('./purgelist.txt');
          await unlinkSync('./failedlist.txt');
        } else {
          interaction.editReply('No purgeable members were found.');
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

      const embed = newEmbed()
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
