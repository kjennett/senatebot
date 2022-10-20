const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { db } = require('../database');
const fetchGgAccountData = require('../api/fetchGgAccountData');
const fs = require('fs');

module.exports = async ggGuildData => {
  let totalGuildOmis = 0;
  let totalTwOmis = 0;
  let totalTbOmis = 0;
  let totalGacOmis = 0;

  const omiCounts = [];
  const noGg = [];

  // Sort members by account name
  const members = ggGuildData.data.members.sort(function (a, b) {
    return a.player_name - b.player_name;
  });

  // Loop through each guild member
  for (const member of members) {
    // Fetch player account data
    const accountData = await fetchGgAccountData(member.ally_code);

    // Add player to the list if they don't have data in SWGOH.GG
    if (!accountData) {
      noGg.push(member.player_name);
      continue;
    }

    // Filter characters that have at least one omicron ability
    const omiCharacters = accountData.units.filter(unit => unit.data.omicron_abilities.length > 0);
    for (const character of omiCharacters) {
      // Add each character's number of omicrons to the total count for the guild
      totalGuildOmis += character.data.omicron_abilities.length;

      for (const ability of character.data.ability_data.filter(ability => ability.has_omicron_learned)) {
        const index = omiCounts.findIndex(abi => abi.id === ability.id);
        if (index === -1) {
          omiCounts.push({
            name: `${ability.name} (${character.data.name})`,
            id: ability.id,
            count: 1,
          });
        } else {
          omiCounts[index].count++;
        }

        const dbAbility = await db.collection('abilities').findOne({ base_id: ability.id });
        if (!dbAbility) continue;

        if (dbAbility.omicron_mode === 7) totalTbOmis++;
        if (dbAbility.omicron_mode === 8) totalTwOmis++;
        if (dbAbility.omicron_mode === 9 || dbAbility.omicron_mode === 14 || dbAbility.omicron_mode === 15) totalGacOmis++;
      }
    }
  }

  omiCounts.sort(function (a, b) {
    return b.count - a.count;
  });

  const highestCount = omiCounts[0].count;
  const allWithHighestCount = omiCounts.filter(omi => omi.count === highestCount);
  let mostPopular = [];
  if (allWithHighestCount.length > 1) {
    for (const omi of allWithHighestCount) [mostPopular.push(`${omi.name} - **${omi.count}**`)];
  } else {
    mostPopular.push(`${allWithHighestCount[0].name} - **${highestCount}**`);
  }

  const allCounts = [];
  allCounts.push(`--- GUILD OMICRON COUNTS ---`);
  for (const omi of omiCounts) {
    allCounts.push(`${omi.name.padEnd(30)} - ${omi.count}`);
  }

  fs.writeFileSync('./omiSummary.txt', allCounts.join('\n'));
  const file = new AttachmentBuilder('./omiSummary.txt');
  fs.unlinkSync('./omiSummary.txt');

  const guildOmiSummary = new EmbedBuilder()
    .setTitle(`Omicron Report: ${ggGuildData.data.name}`)
    .setURL(`https://swgoh.gg/g/${ggGuildData.data.guild_id}/omicrons`)
    .setDescription(`Members: ${ggGuildData.data.member_count}/50 | GP: ${ggGuildData.data.galactic_power.toLocaleString()}`)
    .addFields([
      {
        name: 'Total Guild Omicrons',
        value: `${totalGuildOmis}`,
        inline: true,
      },
      {
        name: `Average Omicrons per Member`,
        value: `${(totalGuildOmis / ggGuildData.data.member_count).toFixed(2)}`,
        inline: true,
      },
      {
        name: `GP per Omicron`,
        value: `${(ggGuildData.data.galactic_power / totalGuildOmis).toFixed(0).toLocaleString()}`,
        inline: true,
      },
      {
        name: `Total TW Omicrons`,
        value: `${totalTwOmis}`,
        inline: true,
      },
      {
        name: `Total TB Omicrons`,
        value: `${totalTbOmis}`,
        inline: true,
      },
      {
        name: `Total GAC Omicrons`,
        value: `${totalGacOmis}`,
        inline: true,
      },
      {
        name: `Most Popular`,
        value: `${mostPopular.join('\n')}`,
      },
    ])
    .setFooter({ text: 'Source: SWGOH.GG // Last Sync Time' })
    .setTimestamp(Date.parse(ggGuildData.data.last_sync));

  return { embeds: [guildOmiSummary], files: [file] };
};
