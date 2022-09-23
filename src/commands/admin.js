const { db } = require('../database');
const config = require('../config');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Configuration and administration commands.')
    .addSubcommand(s1 => s1.setName('restart').setDescription('Exits the process to force-restart SenateBot.'))
    .addSubcommand(s2 =>
      s2
        .setName('updatepriority')
        .setDescription("Updates a guild's recruitment time in the database.")
        .addStringOption(o =>
          o.setName('guild').setDescription('The guild who claimed the recruit.').setAutocomplete(true).setRequired(true)
        )
        .addStringOption(o =>
          o.setName('name').setDescription('The name of the recruit that was claimed.').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('time').setDescription('The aproximate time the recruit was claimed, as a millisecond timestamp')
        )
    )
    .addSubcommand(s3 => s3.setName('order66').setDescription('Show a list of server members that meet purge criteria.')),

  async execute(i) {
    if (i.member.id !== config.owner) {
      return i.reply({
        content: 'This command is usable by the bot administrator only.',
        ephemeral: true,
      });
    }

    const sub = await i.options.getSubcommand();

    if (sub === 'restart') {
      await i.reply({ content: 'Restarting...', ephemeral: true });
      process.exit(1);
    }

    if (sub === 'updatepriority') {
      await i.deferReply();

      const guild = await i.options.getString('guild');
      const name = await i.options.getString('name');
      const time = (await i.options.getString('time')) ?? Date.now();

      await db
        .collection('guilds')
        .findOneAndUpdate({ name: guild }, { $set: { last_recruit_name: name, last_recruit_time: time } });

      return i.editReply({
        embeds: [
          new EmbedBuilder({
            title: 'Last Recruit Time Updated',
            description: `Guild: ${guild}\nRecruit: ${name}\ntime: <t:${Math.floor(time / 1000)}:f>`,
          }),
        ],
      });
    }

    if (sub === 'order66') {
      await i.deferReply();

      const allMembers = await i.guild.members.fetch();
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

        await i.editReply({
          embeds: [
            new EmbedBuilder({
              title: `Order 66 Complete - ${numberOfUsers} users have been removed.`,
            }),
          ],
        });
      } else {
        return i.editReply({
          embeds: [
            new EmbedBuilder({
              title: `No purge-eligible members were found.`,
            }),
          ],
        });
      }
    }
  },
};
