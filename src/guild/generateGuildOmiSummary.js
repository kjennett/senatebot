const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { db } = require('../database');
const fetchGgAccountData = require('../api/fetchGgAccountData');
const fs = require('fs');

module.exports = async ggGuildData => {
  let guildOmis = 0;
  let guildTWOmis = 0;
  let guildTBOmis = 0;
  let guildGACOmis = 0;

  const guildOmiCounts = [];
  const playerOmiCounts = [];
  const noGg = [];

  const summaryFile = [];
  const playerSummary = [];
  summaryFile.push(`/////////// GUILD OMICRON SUMMARY: ${ggGuildData.data.name} ///////////`);
  playerSummary.push(`/////////// OMICRONS BY PLAYER: ${ggGuildData.data.name} ///////////`);

  const members = ggGuildData.data.members.sort((a, b) => {
    if (a.player_name.toLowerCase() < b.player_name.toLowerCase()) return -1;
    if (a.player_name.toLowerCase() > b.player_name.toLowerCase()) return 1;
    return 0;
  });

  for (const member of members) {
    const accountData = await fetchGgAccountData(member.ally_code);
    if (!accountData) {
      noGg.push(member.player_name);
      continue;
    }

    playerSummary.push(`--- ${member.player_name} ---`);

    let playerGACOmis = 0;
    let playerTWOmis = 0;
    let playerTBOmis = 0;

    const omiCharacters = accountData.units.filter(unit => unit.data.omicron_abilities.length > 0);
    const characters = omiCharacters.sort((a, b) => {
      if (a.data.name.toLowerCase() < b.data.name) return -1;
      if (a.data.name.toLowerCase() > b.data.name) return 1;
      return 0;
    });

    for (const character of characters) {
      guildOmis += character.data.omicron_abilities.length;
      playerSummary.push(`${character.data.name} (${character.data.omicron_abilities.length}):`);

      for (const ability of character.data.ability_data.filter(ability => ability.has_omicron_learned)) {
        const index = guildOmiCounts.findIndex(abi => abi.id === ability.id);
        if (index === -1) {
          guildOmiCounts.push({
            name: `${ability.name} (${character.data.name})`,
            id: ability.id,
            count: 1,
          });
        } else {
          guildOmiCounts[index].count++;
        }

        playerSummary.push(`  - ${ability.name}`);

        const dbAbility = await db.collection('abilities').findOne({ base_id: ability.id });
        if (!dbAbility) continue;
        if (dbAbility.omicron_mode === 7) {
          guildTBOmis++;
          playerTBOmis++;
        }
        if (dbAbility.omicron_mode === 8) {
          guildTWOmis++;
          playerTWOmis++;
        }
        if (dbAbility.omicron_mode === 9 || dbAbility.omicron_mode === 14 || dbAbility.omicron_mode === 15) {
          guildGACOmis++;
          playerGACOmis++;
        }
      }
    }

    const total = playerTBOmis + playerGACOmis + playerTWOmis;

    // Add total and mode specific counts to the player summary
    playerSummary.push(`Total: ${total} | TW: ${playerTWOmis} | TB: ${playerTBOmis} | GAC: ${playerGACOmis}`);

    const counts = {
      name: member.player_name,
      count: total,
      tw: playerTWOmis,
      tb: playerTBOmis,
      gac: playerGACOmis,
    };
    // Add the player counts to the running list
    playerOmiCounts.push(counts);
    console.log(JSON.stringify(counts));
  }

  // MOST POPULAR OMICRONS IN GUILD
  guildOmiCounts.sort(function (a, b) {
    return b.count - a.count;
  });
  const highestCount = guildOmiCounts[0].count;
  const mostPopular = [];
  for (const omi of guildOmiCounts) {
    if (omi.count === highestCount) mostPopular.push(`${omi.name} - **${omi.count}**`);
  }
  summaryFile.push(`--- GUILD OMICRON COUNTS ---`);
  for (const omi of guildOmiCounts) {
    summaryFile.push(`${omi.name.padEnd(75)} - ${omi.count}`);
  }

  // GUILD MEMBERS WITH MOST OMICRONS
  playerOmiCounts.sort((a, b) => {
    return b.count - a.count;
  });
  const highestPlayerCount = playerOmiCounts[0].count;
  const mostTotalOmis = [];
  for (const player of playerOmiCounts) {
    if (player.count === highestPlayerCount) mostTotalOmis.push(`${player.name} - **${player.count}**`);
  }
  summaryFile.push(`--- PLAYER TOTAL OMICRONS ---`);
  for (const player of playerOmiCounts) {
    summaryFile.push(`${player.name} - ${player.count}`);
  }

  // GUILD MEMBERS WITH MOST TW OMICRONS
  playerOmiCounts.sort((a, b) => {
    return b.tw - a.tw;
  });
  const highestTWCount = playerOmiCounts[0].tw;
  const mostTotalTW = [];
  for (const player of playerOmiCounts) {
    console.log(`${highestTWCount} -> ${player.tw}`);
    if (player.tw === highestTWCount) mostTotalTW.push(`${player.name} - **${player.tw}**`);
  }
  summaryFile.push(`--- PLAYER TW OMICRONS ---`);
  for (const player of playerOmiCounts) {
    summaryFile.push(`${player.name} - ${player.tw}`);
  }
  console.log(mostTotalTW);

  // GUILD MEMBERS WITH MOST TB OMICRONS
  playerOmiCounts.sort(function (a, b) {
    return b.tb - a.tb;
  });
  const highestTBCount = playerOmiCounts[0].tb;
  const mostTotalTB = [];
  for (const player of playerOmiCounts) {
    console.log(`${highestTBCount} -> ${player.tb}`);
    if (player.tb === highestTBCount) mostTotalTB.push(`${player.name} - **${player.tb}**`);
  }
  summaryFile.push(`--- PLAYER TB OMICRONS ---`);
  for (const player of playerOmiCounts) {
    summaryFile.push(`${player.name} - ${player.tb}`);
  }
  console.log(mostTotalTB);

  // GUILD MEMBERS WITH MOST GAC OMICRONS
  playerOmiCounts.sort(function (a, b) {
    return b.gac - a.gac;
  });
  const highestGACCount = playerOmiCounts[0].gac;
  const mostTotalGAC = [];
  for (const player of playerOmiCounts) {
    console.log(`${highestGACCount} -> ${player.gac}`);
    if (player.gac === highestGACCount) mostTotalGAC.push(`${player.name} - **${player.gac}**`);
  }
  summaryFile.push(`--- PLAYER GAC OMICRONS ---`);
  for (const player of playerOmiCounts) {
    summaryFile.push(`${player.name} - ${player.gac}`);
  }
  console.log(mostTotalGAC);

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
        value: `${guildOmis}`,
        inline: true,
      },
      {
        name: `Average Omicrons per Member`,
        value: `${(guildOmis / ggGuildData.data.member_count).toFixed(2)}`,
        inline: true,
      },
      {
        name: `Total Guild TW Omicrons`,
        value: `${guildTWOmis}`,
        inline: true,
      },
      {
        name: `Total Guild TB Omicrons`,
        value: `${guildTBOmis}`,
        inline: true,
      },
      {
        name: `Total GuildGAC Omicrons`,
        value: `${guildGACOmis}`,
        inline: true,
      },
      {
        name: `Most Total Omicrons`,
        value: mostTotalOmis.join('\n'),
      },
      {
        name: `Most Total TW Omicrons`,
        value: mostTotalTW.join('\n'),
      },
      {
        name: `Most Total TB Omicrons`,
        value: mostTotalTB.join('\n'),
        inline: true,
      },
      {
        name: `Most Total GAC Omicrons`,
        value: mostTotalGAC.join('\n'),
        inline: true,
      },
      {
        name: `Most Popular`,
        value: mostPopular.join('\n'),
      },
    ])
    .setFooter({ text: 'Source: SWGOH.GG // Last Sync Time' })
    .setTimestamp(Date.parse(ggGuildData.data.last_sync));

  if (noGg.length) {
    guildOmiSummary.addFields([
      {
        name: `Players Without GG Data (Not Counted)`,
        value: `${noGg.join(', ')}`,
      },
    ]);
  }

  return { embeds: [guildOmiSummary], files: [file, file2] };
};
