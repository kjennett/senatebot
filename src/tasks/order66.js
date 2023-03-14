const cron = require('node-cron');
const { client } = require('../bot');
const { senateRoles } = require('../configs/senateRoles');
const { senateChannels } = require('../configs/senateChannels');
const { EmbedBuilder } = require('discord.js');

/* ------------------ Member Purge Task ----------------- */

exports.order66 = async () => {
  const server = await client.guilds.fetch(process.env.SENATESERVER);
  const allMembers = await server.members.fetch();

  const twoWeeks = 12096e5;
  const eligible = await allMembers.filter(m => {
    if (m.joinedTimestamp < Date.now() - twoWeeks) {
      if (m.roles.cache.size === 1) return true;
      if (m.roles.cache.size === 2 && m.roles.cache.has(senateRoles.potentialGuildMember)) return true;
      return false;
    }
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

    const recruitment = await client.channels.fetch(senateChannels.recruitmentRoom);
    await recruitment.send({
      embeds: [
        new EmbedBuilder({
          title: `Order 66 Complete - ${numberOfUsers} younglings have been eliminated. Good soldiers follow orders.`,
        }),
      ],
    });
  }
};

/* ------------------- Task Scheduler ------------------- */

cron.schedule(
  '15 */3 * * *', // Runs once every 3 hours
  () => {
    exports.order66();
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  }
);
