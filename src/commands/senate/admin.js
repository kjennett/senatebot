const { config } = require('../../config');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('a')
    .setDescription('Configuration and administration commands.')
    .addSubcommand(s1 => s1.setName('order66').setDescription('Remove all users from the server that meet purge criteria.')),

  async execute(i) {
    // --------------------
    // Admin Permission Check
    // --------------------

    if (i.member.id !== process.env.OWNER) return i.reply('Only the bot administrator may use admin commands.');

    // --------------------
    // Subcommands
    // --------------------

    const sub = await i.options.getSubcommand();

    // --------------------
    // Order 66 - Purge Users
    // --------------------

    if (sub === 'order66') {
      await i.deferReply({ ephemeral: true });

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
              'You have been automatically removed from ΞTHE SENATEΞ Alliance Discord Server, as you have not been granted a membership role within 14 days of joining the server.\nIf you believe this to be in error, please rejoin the server using the following link:\n\nhttp://discord.thesenate.gg\n\nΞThe SenateΞ wishes you good fortune in your SWGOH adventures - may the Force be with you, always!'
            );
          } catch (e) {
            console.info(`Failed to send purge message to: ${m.displayName}`);
          }

          await m.kick('Purged: 14 days without receiving a role.');
        });

        const recruitment = await i.client.channels.fetch(config.channels.recruitmentRoom);
        await recruitment.send({
          embeds: [
            new EmbedBuilder({
              title: `Order 66 Complete - ${numberOfUsers} younglings have been eliminated. Good soldiers folow orders.`,
            }),
          ],
        });

        return i.editReply(`Complete - ${numberOfUsers} users removed.`);
      }

      return i.editReply(`No eligible users found.`);
    }
  },
};
