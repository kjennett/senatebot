const config = require('../config');
const { db } = require('../database');
const client = require('../client');
const { fetchGG, fetchHelp, fetchOmega } = require('./fetchPlayerData');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

/**
 * Returns embeds and images containing a summary of account and
 * mod data for a player account.
 */
module.exports = async parsedAllyCode => {
  // Attempt to fetch player data from SWGOH.GG
  let playerData = await fetchGG(parsedAllyCode);

  // Generate an embed to display the account summary
  const accountSummaryEmbed = new EmbedBuilder().setDescription(`Ally Code: ${parsedAllyCode}`);

  // If player has data in the SWGOH.GG database, generate account summary based on that data
  if (playerData) {
    accountSummaryEmbed.setTitle(`Account Summary: ${playerData.data.name}`);

    // Account's galactic power
    accountSummaryEmbed.addFields([
      {
        name: 'Galactic Power:',
        value: `${playerData.data.galactic_power.toLocaleString()}`,
      },
    ]);

    // If player has GAC data, add it to the embed
    if (playerData.data.level >= 85 && playerData.data.league_name)
      accountSummaryEmbed.addFields([
        {
          name: 'GAC League (Skill Rating):',
          value: `${playerData.data.league_name} ${
            playerData.data.division_number
          } (${playerData.data.skill_rating.toLocaleString()})`,
        },
      ]);

    // If player has fleet arena data, add it to the embed
    if (playerData.data.level >= 60 && playerData.data.fleet_arena)
      accountSummaryEmbed.addFields([
        {
          name: 'Fleet Rank (Last Payout):',
          value: `${playerData.data.fleet_arena.rank ?? '-----'}`,
        },
      ]);

    // Fetch ultimate and omicron material emojis
    const ultEmoji = await client.emojis.cache.get('976604889260126248');
    const omiEmoji = await client.emojis.cache.get('984941574439972954');

    // Build arrays of various categories of ships and characters
    const caps = [];
    const GLs = [];
    const conChars = [];
    const conShips = [];
    const twOmis = [];
    const tbOmis = [];

    for (const unit of playerData.units) {
      // If the unit is a galactic legend, display its gear / relic level and ult status
      if (config.galacticLegends.includes(unit.data.base_id)) {
        const gearLevel = unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
        const ult = unit.data.has_ultimate ? ` ${ultEmoji}` : '';
        GLs.push(`${unit.data.name}: ${gearLevel}${ult}`);
      }

      // If the unit is a capital ship, display its star level
      if (config.capitalShips.includes(unit.data.base_id)) {
        caps.push(`${unit.data.name}: ${unit.data.rarity}:star:`);
      }

      // If the unit is a conquest character, display its gear / relic level
      if (config.conquestCharacters.includes(unit.data.base_id)) {
        const gearLevel = unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
        conChars.push(`${unit.data.name}: ${gearLevel}`);
      }

      // If the unit is a conquest ship, display its star level
      if (config.conquestShips.includes(unit.data.base_id)) {
        conShips.push(`${unit.data.name}: ${unit.data.rarity}:star:`);
      }

      // If the unit has a TB or TW omicron ability unlocked, display each unlocked omicron
      if (unit.data.ability_data.some(a => a.has_omicron_learned)) {
        const tbOmisLearned = [];
        const twOmisLearned = [];

        for (const ability of unit.data.ability_data) {
          if (ability.has_omicron_learned) {
            const omiResult = await db.collection('abilities').findOne({ base_id: ability.id });
            if (omiResult.omicron_mode === 7) {
              tbOmisLearned.push(` - ${ability.name} ${omiEmoji}`);
            }
            if (omiResult.omicron_mode === 8) {
              twOmisLearned.push(` - ${ability.name} ${omiEmoji}`);
            }
          }
        }
        tbOmisLearned.sort();
        twOmisLearned.sort();

        if (tbOmisLearned.length) tbOmis.push(`__${unit.data.name}__\n${tbOmisLearned.join('\n')}`);
        if (twOmisLearned.length) twOmis.push(`__${unit.data.name}__\n${twOmisLearned.join('\n')}`);
      }
    }

    // Alphabetize the list of units and abilities in each category
    caps.sort();
    GLs.sort();
    conChars.sort();
    conShips.sort();
    twOmis.sort();
    tbOmis.sort();

    // Calculate the number of unlocked unts in each category
    const numberOfCaps = caps.length;
    const numberOfGLs = GLs.length;
    const numberOfConChars = conChars.length;
    const numberOfConShips = conShips.length;

    // Add placeholders if the account has no units or abilities unlocked in each category
    if (caps.join() === '') caps.push('-----');
    if (GLs.join() === '') GLs.push('-----');
    if (conChars.join() === '') conChars.push('-----');
    if (conShips.join() === '') conShips.push('-----');
    if (twOmis.join() === '') twOmis.push('-----');
    if (tbOmis.join() === '') tbOmis.push('-----');

    // Display unit / ability counts and lists for each category
    accountSummaryEmbed.addFields([
      {
        name: `Galactic Legends: ${numberOfGLs}/${config.galacticLegends.length}`,
        value: GLs.join('\n'),
      },
      {
        name: `Conquest Characters: ${numberOfConChars}/${config.conquestCharacters.length}`,
        value: conChars.join('\n'),
      },
      {
        name: `Capital Ships: ${numberOfCaps}/${config.capitalShips.length}`,
        value: caps.join('\n'),
      },
      {
        name: `Conquest Ships: ${numberOfConShips}/${config.conquestShips.length}`,
        value: conShips.join('\n'),
      },
      {
        name: `TW Omicrons:`,
        value: twOmis.join('\n'),
      },
      {
        name: `TB Omicrons:`,
        value: tbOmis.join('\n'),
      },
      // Display the link to the account's SWGOH.GG profile
      {
        name: 'SWGOH.gg Profile:',
        value: `https://swgoh.gg/p/${parsedAllyCode}`,
      },
    ]);

    // Generate a new embed to display mod data from the Omega API
    const modSummaryEmbed = new EmbedBuilder().setTitle(`Mod Data: ${playerData.data.name}`);

    // Fetch omega data - it is assumed that the user has mod data via Omega if they have SWGOH.GG account data
    const modData = await fetchOmega(parsedAllyCode);

    // Add ModQ and Omega scores to the embed
    modSummaryEmbed.addFields([
      {
        name: 'ModQ Score:',
        value: `${modData.scores.ModQ.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Omega Score:',
        value: `${modData.scores.Omega.toFixed(2)}`,
        inline: true,
      },
    ]);

    // If image data was obtained, return the embeds and the image
    if (modData.image) {
      const image = new AttachmentBuilder(Buffer.from(modData.image, 'base64'));
      return { embeds: [accountSummaryEmbed, modSummaryEmbed], image: image };
    }

    // If no image data was obtained, return embeds only
    return {
      embeds: [accountSummaryEmbed, modSummaryEmbed],
    };
    // If the player does NOT have SWGOH.GG data, use SWGOH.Help for account summary generation
  } else {
    // Fetch SWGOH.Help data
    playerData = await fetchHelp(parsedAllyCode);

    // Verify that SWGOH.Help data exists (no data indicates invalid ally code)
    if (!playerData) return null;

    // Add title with account name to the summary embed
    accountSummaryEmbed.setTitle(`Player information: ${playerData.name}`).addFields([
      {
        name: 'Galactic Power:',
        value: `${playerData.stats[0].value.toLocaleString()}`,
      },
    ]);

    // If player has GAC data, add it to the embed
    if (playerData.grandArena.length > 0) {
      const lower = playerData.grandArena.at(-1).league.toLowerCase();
      const league = lower.charAt(0).toUpperCase() + lower.slice(1);
      let division;

      // Calculate GAC division number
      switch (playerData.grandArena.at(-1).division) {
        case 5:
          division = '5';
          break;
        case 10:
          division = '4';
          break;
        case 15:
          division = '3';
          break;
        case 20:
          division = '2';
          break;
        case 25:
          division = '1';
          break;
        default:
          division = '';
      }

      accountSummaryEmbed.addFields([
        {
          name: 'GAC League:',
          value: `${league} ${division}`,
        },
      ]);
    } else {
      accountSummaryEmbed.addFields([
        {
          name: 'GAC League:',
          value: '-----',
        },
      ]);
    }

    // If the account has fleet arena data, add it to the embed
    if (playerData.level >= 60)
      accountSummaryEmbed.addFields([
        {
          name: 'Fleet Rank (Real Time):',
          value: `${playerData.arena.ship.rank}`,
        },
      ]);

    // Build arrays of various categories of ships and characters
    const caps = [];
    const GLs = [];
    const conChars = [];
    const conShips = [];

    for (const unit of playerData.roster) {
      // If the unit is a galactic legend, display its gear / relic level
      if (config.galacticLegends.includes(unit.defId)) {
        const glResult = await db.collection('characters').findOne({ base_id: unit.defId });
        const gearLevel = unit.gear > 12 ? `R${unit.relic.currentTier - 2}` : `G${unit.gear}`;
        GLs.push(`${glResult.name}: ${gearLevel}`);
      }

      // If the unit is a conquest character, display its gear / relic level
      if (config.conquestCharacters.includes(unit.defId)) {
        const charResult = await db.collection('characters').findOne({ base_id: unit.defId });
        const gearLevel = unit.gear > 12 ? `R${unit.relic.currentTier - 2}` : `G${unit.gear}`;
        conChars.push(`${charResult.name}: ${gearLevel}`);
      }

      // If the unit is a capital ship, display its star level
      if (config.capitalShips.includes(unit.defId)) {
        const capResult = await db.collection('ships').findOne({ base_id: unit.defId });
        caps.push(`${capResult.name}: ${unit.rarity}:star:`);
      }

      // If the unit is a capital ship, display its star level
      if (config.conquestShips.includes(unit.defId)) {
        const shipResult = await db.collection('ships').findOne({ base_id: unit.defId });
        conShips.push(`${shipResult.name}: ${unit.rarity}:star:`);
      }
    }

    // Alphabetize the list of units and abilities in each category
    caps.sort();
    GLs.sort();
    conChars.sort();
    conShips.sort();

    // Calculate the number of unlocked unts in each category
    const numberOfCaps = caps.length;
    const numberOfGLs = GLs.length;
    const numberOfConChars = conChars.length;
    const numberOfConShips = conShips.length;

    // Add placeholders if the account has no units or abilities unlocked in each category
    if (caps.join() === '') caps.push('-----');
    if (GLs.join() === '') GLs.push('-----');
    if (conChars.join() === '') conChars.push('-----');
    if (conShips.join() === '') conShips.push('-----');

    // Display unit / ability counts and lists for each category
    accountSummaryEmbed.addFields([
      {
        name: `Galactic Legends: ${numberOfGLs}/${config.galacticLegends.length}`,
        value: GLs.join('\n'),
      },
      {
        name: `Conquest Characters: ${numberOfConChars}/${config.conquestCharacters.length}`,
        value: conChars.join('\n'),
      },
      {
        name: `Capital Ships: ${numberOfCaps}/${config.capitalShips.length}`,
        value: caps.join('\n'),
      },
      {
        name: `Conquest Ships: ${numberOfConShips}/${config.conquestShips.length}`,
        value: conShips.join('\n'),
      },
    ]);

    return { embeds: [accountSummaryEmbed] };
  }
};
