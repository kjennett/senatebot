const { db } = require('../../database');
const { config } = require('../../config');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Commands for managing guild status and member roles.')
    .addSubcommandGroup(sG2 =>
      sG2
        .setName('change')
        .setDescription('Change guild information.')
        .addSubcommand(s1 =>
          s1
            .setName('tier')
            .setDescription('Change the recruitment tier of a guild.')
            .addStringOption(o =>
              o
                .setName('guild')
                .setDescription('The guild to change the recruitment tier of.')
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addIntegerOption(option =>
              option.setName('tier').setDescription('The tier to move the guild to.').setAutocomplete(true).setRequired(true)
            )
        )
    ),

  async execute(i) {
    const group = await i.options.getSubcommandGroup();
    const sub = await i.options.getSubcommand();

    if (group === 'change') {
      if (sub === 'tier') {
        await i.deferReply({ ephemeral: true });
        const guildName = await i.options.getString('guild');
        const dbGuild = await db.collection('guilds').findOne({ name: guildName });
        if (!dbGuild) return i.editReply(`Guild ${guildName} was not found in the database.`);

        const tierNumber = await i.options.getInteger('tier');
        const dbTier = await db.collection('tiers').findOne({ number: tierNumber });
        if (!dbTier) return i.editReply(`Tier ${tierNumber} was not found in the database.`);

        if (!i.member.roles.cache.has(dbGuild.officer_role_id) && i.member.id !== process.env.OWNER) {
          return i.editReply(`Only ${guildName} Officers are allowed to change the recruitment tier of their guild.`);
        }

        if (tierNumber === dbGuild.tier) return i.editReply(`${guildName} is already in Tier ${tierNumber}!`);

        const allMembers = await i.guild.members.fetch();
        const recruiters = allMembers.filter(m => m.roles.cache.has(dbGuild.recruiter_role_id));

        if (recruiters.size) {
          const role = await i.guild.roles.fetch(dbTier.recruiter_role_id);
          recruiters.forEach(async r => {
            await r.roles.add(role);
            await r.send(
              `${guildName} has been moved to Tier ${tierNumber} and you have been granted the Tier ${tierNumber} Recruiter role.\nIf you are no longer a recruiter for any guilds in Tier ${dbGuild.tier}, please *manually remove* your Tier ${dbGuild.tier} Recruiter role.`
            );
          });

          await db.collection('guilds').findOneAndUpdate(
            { name: guildName },
            {
              $set: {
                tier: tierNumber,
                last_recruit_time: Date.now(),
                last_recruit_name: `Joined Tier ${tierNumber}`,
              },
            }
          );

          await i.editReply(
            `${guildName} has been moved to Tier ${tierNumber}. All current ${guildName} Recruiters have been granted the Tier ${tierNumber} Recruiter role.`
          );
        } else {
          await i.editReply(
            `${guildName} has been moved to Tier ${tierNumber}. No users with the ${guildName} Recruiter role were found - please *manually* assign your recruiters the ${guildName} Recruiter and Tier ${tierNumber} Recruiter roles.`
          );
        }

        const recruitment = await i.client.channels.fetch(config.channels.recruitmentRoom);
        await recruitment.send({
          embeds: [
            new EmbedBuilder({
              title: `NOTICE: ${guildName} has been moved to Tier ${tierNumber}!`,
            }),
          ],
        });
      }
    }
  },
};
