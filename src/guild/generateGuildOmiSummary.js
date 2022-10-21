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
  const playerCounts = [];
  const noGg = [];

  const summaryFile = [];
  summaryFile.push(`/////////// GUILD OMICRON SUMMARY: ${ggGuildData.data.name} ///////////`);
  summaryFile.push('\n');

  const playerSummary = [];
  playerSummary.push(`/////////// OMICRONS BY PLAYER: ${ggGuildData.data.name} ///////////`);
  playerSummary.push('\n');

  // Sort members by account name
  const members = ggGuildData.data.members.sort(function (a, b) {
    return a.player_name - b.player_name;
  });

  // Loop through each guild member
  for (const member of members) {
    const accountData = await fetchGgAccountData(member.ally_code);
    if (!accountData) {
      noGg.push(member.player_name);
      continue;
    }

    let playerGAC = 0;
    let playerTW = 0;
    let playerTB = 0;

    playerSummary.push(`--- ${member.player_name} ---`);

    // Filter characters that have at least one omicron ability
    const omiCharacters = accountData.units.filter(unit => unit.data.omicron_abilities.length > 0);
    const characters = omiCharacters.sort(function (a, b) {
      a.data.name - b.data.name;
    });

    for (const character of characters) {
      totalGuildOmis += character.data.omicron_abilities.length;
      playerSummary.push(`${character.data.name}:`);

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

        playerSummary.push(`   - ${ability.name}`);

        const dbAbility = await db.collection('abilities').findOne({ base_id: ability.id });
        if (!dbAbility) continue;

        if (dbAbility.omicron_mode === 7) {
          totalTbOmis++;
          playerTB++;
        }

        if (dbAbility.omicron_mode === 8) {
          totalTwOmis++;
          playerTW++;
        }

        if (dbAbility.omicron_mode === 9 || dbAbility.omicron_mode === 14 || dbAbility.omicron_mode === 15) {
          totalGacOmis++;
          playerGAC++;
        }
      }
    }

    playerSummary.push('\n');
    playerSummary.push(`Total: ${playerTB + playerTW + playerGAC} | TW: ${playerTW} | TB: ${playerTB} | GAC: ${playerGAC}`);
    playerSummary.push('\n');

    playerCounts.push({
      name: member.player_name,
      count: playerTW + playerTB + playerGAC,
      tw: playerTW,
      tb: playerTB,
      gac: playerGAC,
    });
  }

  // Add omicrons to summary file sorted by number activated in guild
  omiCounts.sort(function (a, b) {
    return b.count - a.count;
  });

  const highestCount = omiCounts[0].count;
  const allWithHighestCount = omiCounts.filter(omi => omi.count === highestCount);
  let mostPopular = [];
  if (allWithHighestCount.length > 1) {
    for (const omi of allWithHighestCount) {
      mostPopular.push(`${omi.name} - **${omi.count}**`);
    }
  } else {
    mostPopular.push(`${allWithHighestCount[0].name} - **${highestCount}**`);
  }

  summaryFile.push(`--- GUILD OMICRON COUNTS ---`);
  for (const omi of omiCounts) {
    summaryFile.push(`${omi.name.padEnd(75)} - ${omi.count}`);
  }
  summaryFile.push(`\n`);

  // Add members to summary file sorted by number of total omicrons

  playerCounts.sort(function (a, b) {
    return b.count - a.count;
  });

  const highestPlayerCount = playerCounts[0].count;
  const allWithHighestPlayerCount = playerCounts.filter(player => player.count === highestPlayerCount);
  let mostTotalOmis = [];
  if (allWithHighestPlayerCount.length > 1) {
    for (const player of allWithHighestPlayerCount) {
      mostTotalOmis.push(`${player.name} - **${player.count}**`);
    }
  } else {
    mostTotalOmis.push(`${allWithHighestPlayerCount[0].name} - **${highestPlayerCount}**`);
  }

  summaryFile.push(`--- PLAYER TOTAL OMICRONS ---`);
  for (const player of playerCounts) {
    summaryFile.push(`${player.name} - ${player.count}`);
  }
  summaryFile.push('\n');

  // Add membrs to summary file sorted by number of TW Omicrons

  playerCounts.sort(function (a, b) {
    return b.tw - a.tw;
  });

  const highestTWCount = playerCounts[0].count;
  const allWithHighestTWCount = playerCounts.filter(player => player.count === highestTWCount);
  let mostTotalTW = [];
  if (allWithHighestTWCount.length > 1) {
    for (const player of allWithHighestTWCount) {
      mostTotalTW.push(`${player.name} - **${player.count}**`);
    }
  } else {
    mostTotalTW.push(`${allWithHighestTWCount[0].name} - **${highestTWCount}**`);
  }

  summaryFile.push(`--- PLAYER TOTAL TW OMICRONS ---`);
  for (const player of playerCounts) {
    summaryFile.push(`${player.name} - ${player.tw}`);
  }
  summaryFile.push('\n');

  // Add members to summary file sorted by number of TB Omicrons
  playerCounts.sort(function (a, b) {
    return b.tb - a.tb;
  });

  const highestTBCount = playerCounts[0].count;
  const allWithHighestTBCount = playerCounts.filter(player => player.count === highestTBCount);
  let mostTotalTB = [];
  if (allWithHighestTBCount.length > 1) {
    for (const player of allWithHighestTBCount) {
      mostTotalTB.push(`${player.name} - **${player.tb}**`);
    }
  } else {
    mostTotalTB.push(`${allWithHighestTBCount[0].name} - **${highestTBCount}**`);
  }

  summaryFile.push(`--- PLAYER TOTAL TB OMICRONS ---`);
  for (const player of playerCounts) {
    summaryFile.push(`${player.name} - ${player.tb}`);
  }
  summaryFile.push('\n');

  // Add members to summary file sorted by number of GAC omicrons
  playerCounts.sort(function (a, b) {
    return b.gac - a.gac;
  });

  const highestGACCount = playerCounts[0].count;
  const allWithHighestGACCount = playerCounts.filter(player => player.count === highestGACCount);
  let mostTotalGAC = [];
  if (allWithHighestGACCount.length > 1) {
    for (const player of allWithHighestGACCount) {
      mostTotalGAC.push(`${player.name} - **${player.gac}**`);
    }
  } else {
    mostTotalGAC.push(`${allWithHighestGACCount[0].name} - **${highestGACCount}**`);
  }

  summaryFile.push(`--- PLAYER TOTAL GAC OMICRONS ---`);
  for (const player of playerCounts) {
    summaryFile.push(`${player.name} - ${player.gac}`);
  }
  summaryFile.push('\n');

  fs.writeFileSync('./guildSummary.txt', summaryFile.join('\n'));
  const file = new AttachmentBuilder('./guildSummary.txt');
  fs.writeFileSync('./playerSummary.txt', playerSummary.join('\n'));
  const file2 = new AttachmentBuilder('./playerSummary.txt');

  const guildOmiSummary = new EmbedBuilder()
    .setTitle(`Omicron Report: ${ggGuildData.data.name}`)
    .setURL(`https://swgoh.gg/g/${ggGuildData.data.guild_id}`)
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
        value: `${(ggGuildData.data.galactic_power / totalGuildOmis).toLocaleString()}`,
        inline: true,
      },
      {
        name: `Most Popular`,
        value: `${mostPopular.join('\n')}`,
      },
      {
        name: `Total Guild TW Omicrons`,
        value: `${totalTwOmis}`,
        inline: true,
      },
      {
        name: `Total Guild TB Omicrons`,
        value: `${totalTbOmis}`,
        inline: true,
      },
      {
        name: `Total GuildGAC Omicrons`,
        value: `${totalGacOmis}`,
        inline: true,
      },
      {
        name: `Most Total Omicrons`,
        value: `${mostTotalOmis.join('\n')}`,
      },
      {
        name: `Most Total TW Omicrons`,
        value: `${mostTotalTW.join('\n')}`,
      },
      {
        name: `Most Total TB Omicrons`,
        value: `${mostTotalTB.join('\n')}`,
      },
      {
        name: `Most Total GAC Omicrons`,
        value: `${mostTotalGAC.join('\n')}`,
      },
    ])
    .setFooter({ text: 'Source: SWGOH.GG // Last Sync Time' })
    .setTimestamp(Date.parse(ggGuildData.data.last_sync));

  if (noGg.length) {
    guildOmiSummary.addFields([
      {
        name: `Players Without GG Data (Not Included in)`,
        value: `${noGg.join(', ')}`,
      },
    ]);
  }

  return { embeds: [guildOmiSummary], files: [file, file2] };
};
