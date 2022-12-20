const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../database');
const { fetchGuildProfile, fetchAccount } = require('../../api/swgohgg');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gacpissingmatch')
    .setDescription(
      "Runs a comparative analysis of all the guilds in the SENATE based on their members' GAC performance."
    ),

  async execute(i) {
    await i.deferReply();

    if (i.member.id !== process.env.OWNER)
      return i.deferReply('Only the bot administrator may run this command (for now!)');

    /** Total alliance member count for all guilds */
    let totalAllianceMembers = 0;
    /** Total GP of all alliance guilds */
    let totalAlliancePower = 0;
    const allGuilds = await db.collection('guilds').find().toArray();
    for (const guild of allGuilds) {
      totalAllianceMembers += guild.members;
      totalAlliancePower += guild.gp;
    }

    const totalAllianceMillionGP = totalAlliancePower / 1000000;

    let totalScannedMembers = 0;
    let totalAllianceSkillRating = 0;
    let guildCount = 1;
    for (const guild of allGuilds) {
      await i.editReply(`Scanning guild members - Guild ${guildCount} of ${allGuilds.length}`);
      const guildProfile = await fetchGuildProfile(guild.gg);

      for (const member of guildProfile.data.members) {
        if (!member.ally_code) continue;

        const accountData = await fetchAccount(member.ally_code);
        if (!accountData) continue;

        if (accountData.data.skill_rating) {
          totalAllianceSkillRating += accountData.data.skill_rating;
          totalScannedMembers += 1;
        }
      }

      guildCount++;
    }

    await i.editReply(
      `_ _\nTotal Alliance Members: ${totalAllianceMembers.toLocaleString()}\nTotal Alliance GP: ${totalAlliancePower.toLocaleString()}\nTotal Alliance Skill Rating: ${
        totalAllianceSkillRating.toLocaleString
      }\nAlliance Average Skill Rating: ${Math.floor(
        totalAllianceSkillRating / totalScannedMembers
      )}\nAlliance Average Skill Rating Per 1M GP: ${(
        totalAllianceSkillRating / totalAllianceMillionGP
      ).toFixed(2)}`
    );
  },
};
