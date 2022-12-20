const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../../database');

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

    let totalAllianceMembers;
    let totalAlliancePower;
    const allGuilds = await db.collection('guilds').find({}).toArray();
    for (const guild of allGuilds) {
      totalAllianceMembers += guild.members;
      totalAlliancePower += guild.gp;
    }

    return i.editReply(
      `Total alliance members: ${totalAllianceMembers} | Total alliance galactic power: ${totalAlliancePower.toLocaleString()}`
    );
  },
};
