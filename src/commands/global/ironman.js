const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchGuildProfile } = require('../../api/swgohgg');
const { db } = require('../../database');

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder()
    .setName('ironman')
    .setDescription('Lists guild members sorted by the time they joined the guild.')
    .addStringOption(o =>
      o
        .setName('guild')
        .setDescription('The guild to pull member information about.')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async execute(i) {
    await i.deferReply();
    console.timeEnd(`${i.id} Response`);

    const guildName = i.options.getString('guild');
    const dbGuild = await db.collection('guilds').findOne({ name: guildName });
    if (!dbGuild) return i.editReply(`Guild ${guildName} was not found in the database.`);
    if (!dbGuild.gg) return i.editReply(`Unable to find a SWGOH.GG guild ID for ${guildName}.`);

    const ggGuildData = await fetchGuildProfile(dbGuild.gg);
    if (!ggGuildData)
      return i.editReply(`Unable to retrieve SWGOH.GG guild profile data for ${guildName}.`);

    const members = ggGuildData.data.members;
    members.sort((a, b) => a.guild_join_time.localeCompare(b.guild_join_time));
    const oldestMembers = members.slice(9);

    const memberList = [];
    let count = 1;
    for (const member of oldestMembers) {
      const name = member.player_name;
      const joinDate = new Date(member.guild_join_time);
      const joinTimestamp = joinDate.getTime();

      memberList.push(`${count}. ${name} - Joined <t:${Math.floor(joinTimestamp / 1000)}:R>`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`Oldest Member Accounts - ${guildName}`)
      .setDescription(memberList.join('\n'));

    await i.editReply({ embeds: [embed] });
  },
};
