const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('@discordjs/builders');
const { db } = require('../database');
const { config } = require('../config');
const { writeFileSync, unlinkSync } = require('fs');
const { MessageAttachment, MessageEmbed } = require('discord.js');

const restartSubcommand = new SlashCommandSubcommandBuilder()
  .setName('restart')
  .setDescription('Exits the process to force-restart SenateBot.');

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

module.exports = {
  enabled: true,
  hidden: false,

  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Configuration and administration commands for SenateBot.')
    .addSubcommand(restartSubcommand)
    .addSubcommand(updatePrioritySubcommand)
    .addSubcommand(order66Subcommand),

  async execute(interaction) {
    if (interaction.member.id !== config.owner) {
      return interaction.reply({ embeds: [config.errorEmbeds.adminOnly], ephemeral: true });
    }

    const sub = await interaction.options.getSubcommand();

    if (sub === 'restart') {
      await interaction.reply({ embeds: [config.successEmbeds.restart], ephemeral: true });
      process.exit(1);
    }

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
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'order66') {
      await interaction.deferReply();

      const allMembers = await interaction.guild.members.fetch();
      const eligible = await allMembers.filter(m => {
        if (
          m.roles.cache.has(config.roles.potentialGuildMember) &&
          m.roles.cache.size === 2 &&
          m.joinedTimestamp < Date.now() - 12096e5
        )
          return true;
        if (m.roles.cache.size === 1 && m.joinedTimestamp < Date.now() - 12096e5) return true;
        return false;
      });

      if (await !interaction.options.getBoolean('doit')) {
        const eligibleList = [];
        eligible.forEach(m =>
          eligibleList.push(
            `User: ${m.displayName} | Joined: ${new Date(m.joinedTimestamp).toLocaleDateString()} | Roles: ${
              m.roles.cache.size - 1
            }`
          )
        );

        if (eligibleList.length) {
          const embed = new MessageEmbed({
            title: 'Purgeable Users',
            description: `The following ${eligibleList.length} members:\n - __Only__ have the Potential Guild Member role, or have no roles\n - Joined the server more than 14 days ago\n - Do not have an active recruitment thread.`,
          });
          await writeFileSync('./purgelist.txt', eligibleList.join('\n'));
          const fileAttachment = new MessageAttachment('./purgelist.txt');
          await interaction.editReply({
            embeds: [embed],
          });
          await interaction.followUp({ files: [fileAttachment] });
          await unlinkSync('./purgelist.txt');
        } else {
          const embed = new MessageEmbed({
            title: 'No purge-eligible members were found.',
            color: 'RED',
          });
          return interaction.editReply({ embeds: [embed] });
        }
      } else {
        if (eligible.size) {
          const numberOfUsers = eligible.size;
          eligible.forEach(async m => {
            try {
              await m.send(
                'You have been automatically removed from ΞTHE SENATEΞ Alliance Discord Server, as you have not been granted a role within 14 days of joining the server.\nIf you believe this to be in error, please rejoin the server using the following link:\n\nhttp://discord.thesenate.gg\n\nΞThe SenateΞ wishes you good fortune in your SWGOH adventures - may the Force be with you, always!'
              );
            } catch (e) {
              console.info(`Failed to send purge message to: ${m.displayName}`);
            }

            await m.kick('Purged: 14 days without receiving a role.');
          });

          const embed = new MessageEmbed({
            title: `Order 66 Complete - ${numberOfUsers} users have been removed.`,
            color: 'GREEN',
          });
          await interaction.editReply({
            embeds: [embed],
          });
        } else {
          const embed = new MessageEmbed({
            title: `No purge-eligible members were found.`,
            color: 'RED',
          });
          return interaction.editReply({ embeds: [embed] });
        }
      }
    }
  },
};
