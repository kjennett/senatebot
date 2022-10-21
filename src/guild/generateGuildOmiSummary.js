const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { db } = require('../database');
const fetchGgAccountData = require('../api/fetchGgAccountData');
const fs = require('fs');

module.exports = async ggGuildData => {
  // Running counts of each type of omicron in the guild
  let guildOmis = 0;
  let guildTWOmis = 0;
  let guildTBOmis = 0;
  let guildGACOmis = 0;

  // Running counts of the number of the number of each omicron in the guild
  const guildOmiCounts = [];

  // Running counts of the type of omicrons applied for each player
  const playerCounts = [];

  // List of account names of players without SWGOH.GG data
  const noGg = [];

  // Start arrays to store lines of guild and player account summary text files
  const summaryFile = [];
  summaryFile.push(`/////////// GUILD OMICRON SUMMARY: ${ggGuildData.data.name} ///////////`);
  const playerSummary = [];
  playerSummary.push(`/////////// OMICRONS BY PLAYER: ${ggGuildData.data.name} ///////////`);

  // Sort guild members alphabetically by name
  const members = ggGuildData.data.members.sort((a, b) => {
    if (a.player_name.toLowerCase() < b.player_name.toLowerCase()) return -1;
    if (a.player_name.toLowerCase() > b.player_name.toLowerCase()) return 1;
    return 0;
  });

  // Loop through each guild member, sorted alphabetically by player name
  for (const member of members) {
    const accountData = await fetchGgAccountData(member.ally_code);

    // Add username to the list if the player doesn't have data in SWGOH.GG
    if (!accountData) {
      noGg.push(member.player_name);
      continue;
    }

    // Start running count of the player's omicrons, by type
    let playerGACOmis = 0;
    let playerTWOmis = 0;
    let playerTBOmis = 0;

    // Add player name to player summary
    playerSummary.push(`--- ${member.player_name} ---`);

    // Filter to characters that have at least one omicron ability, sorted alphabetically by character name
    const omiCharacters = accountData.units.filter(unit => unit.data.omicron_abilities.length > 0);
    const characters = omiCharacters.sort((a, b) => {
      if (a.data.name.toLowerCase() < b.data.name) return -1;
      if (a.data.name.toLowerCase() > b.data.name) return 1;
      return 0;
    });

    // For each character with an omicron unlocked...
    for (const character of characters) {
      // Add the total number of unlocked omicrons for the character to the guild count
      guildOmis += character.data.omicron_abilities.length;

      // Add character name to the summary
      playerSummary.push(`${character.data.name} (${character.data.omicron_abilities.length}):`);

      // For each omicron ability...
      for (const ability of character.data.ability_data.filter(ability => ability.has_omicron_learned)) {
        // If the omicron already has a running count, add to it, otherwise, start the count
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

        // Add the ability name to the summary
        playerSummary.push(`   - ${ability.name}`);

        // Pull database information about the ability
        const dbAbility = await db.collection('abilities').findOne({ base_id: ability.id });
        if (!dbAbility) continue;

        // Match omicron mode to the ability and update running guild counts
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

    // Add total and mode specific counts to the player summary
    playerSummary.push(
      `Total: ${
        playerTBOmis + playerTWOmis + playerGACOmis
      } | TW: ${playerTWOmis} | TB: ${playerTBOmis} | GAC: ${playerGACOmis}`
    );

    // Add the player counts to the running list
    playerCounts.push({
      name: member.player_name,
      count: playerTWOmis + playerTBOmis + playerGACOmis,
      tw: playerTWOmis,
      tb: playerTBOmis,
      gac: playerGACOmis,
    });
  }

  // Sort omicrons by number applied in guild
  guildOmiCounts.sort(function (a, b) {
    return b.count - a.count;
  });

  // After sorting, the first item in the list should have the highest number applied
  const highestCount = guildOmiCounts[0].count;
  console.log(`Highest count: ${highestCount}`);

  // Filter only for all the omicrons that have the highest number applied
  const allWithHighestCount = guildOmiCounts.filter(omi => omi.count === highestCount);
  let mostPopular = [];

  for (const omi of allWithHighestCount) {
    mostPopular.push(`${omi.name} - **${omi.count}**`);
  }
  console.log(`Most Popular: ${mostPopular.join('\n')}`);

  // Push count of all applied omicrons in guild to the summary file
  summaryFile.push(`--- GUILD OMICRON COUNTS ---`);
  for (const omi of guildOmiCounts) {
    summaryFile.push(`${omi.name.padEnd(75)} - ${omi.count}`);
  }

  // Sort players by highest number of total omicrons applied
  playerCounts.sort((a, b) => {
    return b.count - a.count;
  });

  // After sorting, the first player should be the one with the highest number of omicrons
  const highestPlayerCount = playerCounts[0].count;
  console.log(`Highest player count: ${highestPlayerCount}`);

  // Find all players who have the highest number of omicrons
  const allWithHighestPlayerCount = playerCounts.filter(player => player.count === highestPlayerCount);
  let mostTotalOmis = [];

  // If more than one, include them all
  for (const player of allWithHighestPlayerCount) {
    mostTotalOmis.push(`${player.name} - **${player.count}**`);
  }
  console.log(`Most total omis: ${mostTotalOmis.join('\n')}`);

  // Add players ordered by number of omicrons to the guild summary
  summaryFile.push(`--- PLAYER TOTAL OMICRONS ---`);
  for (const player of playerCounts) {
    summaryFile.push(`${player.name} - ${player.count}`);
  }

  // Add members to summary file sorted by number of TW omicrons
  playerCounts.sort(function (a, b) {
    return b.tw - a.tw;
  });

  const highestTWCount = playerCounts[0].count;
  console.log(`Highest TW count: ${highestTWCount}`);
  const allWithHighestTWCount = playerCounts.filter(player => player.tw === highestTWCount);
  let mostTotalTW = [];
  for (const player of allWithHighestTWCount) {
    mostTotalTW.push(`${player.name} - **${player.tw}**`);
  }
  console.log(`Highest TW Count: ${mostTotalTW.join('\n')}`);

  summaryFile.push(`--- PLAYER TW OMICRONS ---`);
  for (const player of playerCounts) {
    summaryFile.push(`${player.name} - ${player.tw}`);
  }

  // Add members to summary file sorted by number of TB omicrons
  playerCounts.sort(function (a, b) {
    return b.tb - a.tb;
  });

  const highestTBCount = playerCounts[0].count;
  console.log(`Highest TB count: ${highestTBCount}`);
  const allWithHighestTBCount = playerCounts.filter(player => player.tb === highestTBCount);
  let mostTotalTB = [];
  for (const player of allWithHighestTBCount) {
    mostTotalTB.push(`${player.name} - **${player.tb}**`);
  }
  console.log(`Highest TB count: ${mostTotalTB.join('\n')}`);

  summaryFile.push(`--- PLAYER TB OMICRONS ---`);
  for (const player of playerCounts) {
    summaryFile.push(`${player.name} - ${player.tb}`);
  }

  // Add members to summary file sorted by number total GAC omicrons
  playerCounts.sort(function (a, b) {
    return b.gac - a.gac;
  });

  const highestGACCount = playerCounts[0].count;
  console.log(`Highest GAC count: ${highestGACCount}`);
  const allWithHighestGACCount = playerCounts.filter(player => player.gac === highestGACCount);
  let mostTotalGAC = [];
  for (const player of allWithHighestGACCount) {
    mostTotalGAC.push(`${player.name} - **${player.gac}**`);
  }
  console.log(`Highest GAC Count: ${mostTotaGAC.join('\n')}`);

  summaryFile.push(`--- PLAYER GAC OMICRONS ---`);
  for (const player of playerCounts) {
    summaryFile.push(`${player.name} - ${player.gac}`);
  }

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
        value: `${mostTotalOmis.join('\n')}`,
      },
      {
        name: `Most Total TW Omicrons`,
        value: `${mostTotalTW.join('\n')}`,
      },
      {
        name: `Most Total TB Omicrons`,
        value: `${mostTotalTB.join('\n')}`,
        inline: true,
      },
      {
        name: `Most Total GAC Omicrons`,
        value: `${mostTotalGAC.join('\n')}`,
        inline: true,
      },
      {
        name: `Most Popular`,
        value: `${mostPopular.join('\n')}`,
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
