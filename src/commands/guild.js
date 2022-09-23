const { db } = require('../database');
const { config } = require('../config');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Commands for managing guild status and member roles.')
    .addSubcommandGroup(sG1 =>
      sG1
        .setName('add')
        .setDescription('Add guild-specific Discord roles to a user account.')
        .addSubcommand(s1 =>
          s1
            .setName('member')
            .setDescription('Add Guild Member and Senate Citizen roles to a user account.')
            .addStringOption(o =>
              o
                .setName('guild')
                .setDescription('The guild to add Member roles for.')
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addUserOption(o =>
              o
                .setName('user')
                .setDescription('The Discord user to add the roles to.')
                .setRequired(true)
            )
        )
        .addSubcommand(s2 =>
          s2
            .setName('officer')
            .setDescription('Add Guild Officer roles to a user account.')
            .addStringOption(o =>
              o
                .setName('guild')
                .setDescription('The guild to add Officer roles for.')
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addUserOption(o =>
              o
                .setName('user')
                .setDescription('The Discord user to add the roles to.')
                .setRequired(true)
            )
        )
        .addSubcommand(s3 =>
          s3
            .setName('recruiter')
            .setDescription('Add Guild Recruiter and Recruitment roles to a user account.')
            .addStringOption(o =>
              o
                .setName('guild')
                .setDescription('The guild to add Recruiter roles for.')
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addUserOption(o =>
              o
                .setName('user')
                .setDescription('The Discord user to add the roles to.')
                .setRequired(true)
            )
        )
        .addSubcommand(s4 =>
          s4
            .setName('guest')
            .setDescription('Add Guild Guest roles to a user account.')
            .addStringOption(o =>
              o
                .setName('guild')
                .setDescription('The guild to add Guest roles for.')
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addUserOption(o =>
              o
                .setName('user')
                .setDescription('The Discord user to add the roles to.')
                .setRequired(true)
            )
        )
    )
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
              option
                .setName('tier')
                .setDescription('The tier to move the guild to.')
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
    ),

  async execute(i) {
    await i.deferReply({ ephemeral: true });
    const group = await i.options.getSubcommandGroup();
    const sub = await i.options.getSubcommand();

    if (group === 'add') {
      const guildName = await i.options.getString('guild');
      const dbGuild = await db.collection('guilds').findOne({ name: guildName });
      if (!dbGuild) return i.editReply(`Guild ${guildName} was not found in the database.`);

      if (!i.member.roles.cache.has(dbGuild.officer_role_id) && i.member.id !== process.env.OWNER) {
        return i.editReply(`Only ${guildName} Officers are allowed to add roles for their guild.`);
      }

      const user = await i.options.getUser('user');
      const member = await i.guild.members.fetch(user.id);

      if (sub === 'member') {
        const role = await i.guild.roles.fetch(dbGuild.member_role_id);
        const citizenRole = await i.guild.roles.fetch(config.roles.senateCitizen);
        await member.roles.add(role);
        await member.roles.add(citizenRole);
        await member.send(
          `${i.member.displayName} has granted you the following roles in ΞTHE SENATEΞ Discord: ${guildName} Member, Senate Citizen.`
        );
        return i.editReply(`Granted ${role} and ${citizenRole} roles to ${member.displayName}.`);
      }

      if (sub === 'officer') {
        const role = await i.guild.roles.fetch(dbGuild.officer_role_id);
        const oRole = await i.guild.roles.fetch(config.roles.guildOfficer);
        await member.roles.add(role);
        await member.roles.add(oRole);
        await member.send(
          `${i.member.displayName} has granted you the following roles in ΞTHE SENATEΞ Discord: ${guildName} Officer, Guild Officer.`
        );
        return i.editReply(`Granted ${role} and ${oRole} roles to ${member.displayName}.`);
      }

      if (sub === 'recruiter') {
        const role = await i.guild.roles.fetch(dbGuild.recruiter_role_id);
        const rRole = await i.guild.roles.fetch(config.roles.recruitment);
        const dbTier = await db.collection('tiers').findOne({ number: dbGuild.tier });
        const tRole = await i.guild.roles.fetch(dbTier.recruiter_role_id);

        await member.roles.add(role);
        await member.roles.add(rRole);
        await member.roles.add(tRole);
        await member.send(
          `${i.member.displayName} has granted you the following roles in ΞTHE SENATEΞ Discord: ${guildName} Recruiter, Tier ${dbGuild.tier} Recruiter, Recruitment.`
        );
        return i.editReply(`Granted ${role} and ${rRole} roles to ${member.displayName}.`);
      }

      if (sub === 'guest') {
        const role = await i.guild.roles.fetch(dbGuild.guest_role_id);
        await member.roles.add(role);
        await member.send(
          `${i.member.displayName} has granted you the following roles in ΞTHE SENATEΞ Discord: ${guildName} Guest.`
        );
        return i.editReply(`Granted ${role} role to ${member.displayName}.`);
      }
    }

    if (group === 'change') {
      if (sub === 'tier') {
        const guildName = await i.options.getString('guild');
        const dbGuild = await db.collection('guilds').findOne({ name: guildName });
        if (!dbGuild) return i.editReply(`Guild ${guildName} was not found in the database.`);

        const tierNumber = await i.options.getInteger('tier');
        const dbTier = await db.collection('tiers').findOne({ number: tierNumber });
        if (!dbTier) return i.editReply(`Tier ${tierNumber} was not found in the database.`);

        if (
          !i.member.roles.cache.has(dbGuild.officer_role_id) &&
          i.member.id !== process.env.OWNER
        ) {
          return i.editReply(
            `Only ${guildName} Officers are allowed to change the recruitment tier of their guild.`
          );
        }

        if (tierNumber === dbGuild.tier)
          return i.editReply(`${guildName} is already in Tier ${tierNumber}!`);

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
