const { config } = require('../config');
const { db } = require('../database');
const { client } = require('../client');
const { fetchGG, fetchHelp, fetchOmega } = require('./fetchPlayerData');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

exports.generateAccountSummary = async parsedAllyCode => {
  let playerData = await fetchGG(parsedAllyCode);
  const accountSummaryEmbed = new EmbedBuilder();
  accountSummaryEmbed.setDescription(`Ally Code: ${parsedAllyCode}`);

  if (playerData) {
    accountSummaryEmbed.setTitle(`Account Summary: ${playerData.data.name}`);
    accountSummaryEmbed.setTimestamp(new Date(playerData.data.last_updated));
    accountSummaryEmbed.addFields([
      {
        name: 'Galactic Power:',
        value: `${playerData.data.galactic_power.toLocaleString()}`,
      },
    ]);

    if (playerData.data.level >= 85 && playerData.data.league_name)
      accountSummaryEmbed.addFields([
        {
          name: 'GAC League (Skill Rating):',
          value: `${playerData.data.league_name} ${
            playerData.data.division_number
          } (${playerData.data.skill_rating.toLocaleString()})`,
        },
      ]);

    if (playerData.data.level >= 60 && playerData.data.fleet_arena)
      accountSummaryEmbed.addFields([
        {
          name: 'Fleet Rank (Last Payout):',
          value: `${playerData.data.fleet_arena.rank ?? '-----'}`,
        },
      ]);

    const ultEmoji = await client.emojis.cache.get('976604889260126248');
    const omiEmoji = await client.emojis.cache.get('984941574439972954');

    const caps = [];
    const GLs = [];
    const conChars = [];
    const conShips = [];
    const twOmis = [];
    const tbOmis = [];

    for (const unit of playerData.units) {
      if (config.galacticLegends.includes(unit.data.base_id)) {
        const gearLevel =
          unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
        const ult = unit.data.has_ultimate ? ` ${ultEmoji}` : '';
        GLs.push(`${unit.data.name}: ${gearLevel}${ult}`);
      }

      if (config.capitalShips.includes(unit.data.base_id)) {
        caps.push(`${unit.data.name}: ${unit.data.rarity}:star:`);
      }

      if (config.conquestCharacters.includes(unit.data.base_id)) {
        const gearLevel =
          unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
        conChars.push(`${unit.data.name}: ${gearLevel}`);
      }

      if (config.conquestShips.includes(unit.data.base_id)) {
        conShips.push(`${unit.data.name}: ${unit.data.rarity}:star:`);
      }

      if (unit.data.ability_data.some(a => a.has_omicron_learned)) {
        const tbOmisLearned = [];
        const twOmisLearned = [];

        for (const ability of unit.data.ability_data) {
          if (ability.has_omicron_learned) {
            const omiResult = await db.collection('abilities').findOne({ base_id: ability.id });
            if (omiResult.omicron_mode === 7) {
              tbOmisLearned.push(` - ${ability.name} ${omiEmoji}`);
            }
            if (omiResult.omicron_mode === 8 || omiResult.omicron_mode === 14) {
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

    caps.sort();
    GLs.sort();
    conChars.sort();
    conShips.sort();
    twOmis.sort();
    tbOmis.sort();

    const numberOfCaps = caps.length;
    const numberOfGLs = GLs.length;
    const numberOfConChars = conChars.length;
    const numberOfConShips = conShips.length;

    if (caps.join() === '') caps.push('-----');
    if (GLs.join() === '') GLs.push('-----');
    if (conChars.join() === '') conChars.push('-----');
    if (conShips.join() === '') conShips.push('-----');
    if (twOmis.join() === '') twOmis.push('-----');
    if (tbOmis.join() === '') tbOmis.push('-----');

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
      {
        name: 'SWGOH.gg Profile:',
        value: `https://swgoh.gg/p/${parsedAllyCode}`,
      },
    ]);

    const modSummaryEmbed = new EmbedBuilder().setTitle(`Mod Data: ${playerData.data.name}`);

    const modData = await fetchOmega(parsedAllyCode);

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

    if (modData.image) {
      const image = new AttachmentBuilder(Buffer.from(modData.image, 'base64'), 'modgraph.png');
      modSummaryEmbed.setImage('attachment://modgraph.png');
      return { embeds: [accountSummaryEmbed, modSummaryEmbed], files: [image] };
    }

    return {
      embeds: [accountSummaryEmbed, modSummaryEmbed],
    };
  } else {
    playerData = await fetchHelp(parsedAllyCode);
    if (!playerData) return null;

    accountSummaryEmbed
      .setTitle(`Player information: ${playerData.name}`)
      .setFooter({
        text: 'Data source: SWGOH.Help',
        iconURL: process.env.SENATELOGO,
      })
      .setTimestamp()
      .addFields([
        {
          name: 'Galactic Power:',
          value: `${playerData.stats[0].value.toLocaleString()}`,
        },
      ]);

    if (playerData.grandArena.length > 0) {
      const lower = playerData.grandArena.at(-1).league.toLowerCase();
      const league = lower.charAt(0).toUpperCase() + lower.slice(1);
      let division;

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
    if (playerData.level >= 85)
      accountSummaryEmbed.addFields([
        {
          name: 'Fleet Rank (Real Time):',
          value: `${playerData.arena.ship.rank}`,
        },
      ]);

    const caps = [];
    const GLs = [];
    const conChars = [];
    const conShips = [];

    for (const unit of playerData.roster) {
      if (config.galacticLegends.includes(unit.defId)) {
        const glResult = await db.collection('characters').findOne({ base_id: unit.defId });
        const gearLevel = unit.gear > 12 ? `R${unit.relic.currentTier - 2}` : `G${unit.gear}`;
        GLs.push(`${glResult.name}: ${gearLevel}`);
      }

      if (config.conquestCharacters.includes(unit.defId)) {
        const charResult = await db.collection('characters').findOne({ base_id: unit.defId });
        const gearLevel = unit.gear > 12 ? `R${unit.relic.currentTier - 2}` : `G${unit.gear}`;
        conChars.push(`${charResult.name}: ${gearLevel}`);
      }

      if (config.capitalShips.includes(unit.defId)) {
        const capResult = await db.collection('ships').findOne({ base_id: unit.defId });
        caps.push(`${capResult.name}: ${unit.rarity}:star:`);
      }

      if (config.conquestShips.includes(unit.defId)) {
        const shipResult = await db.collection('ships').findOne({ base_id: unit.defId });
        conShips.push(`${shipResult.name}: ${unit.rarity}:star:`);
      }
    }
    caps.sort();
    GLs.sort();
    conChars.sort();
    conShips.sort();

    const numberOfCaps = caps.length;
    const numberOfGLs = GLs.length;
    const numberOfConChars = conChars.length;
    const numberOfConShips = conShips.length;

    if (caps.join() === '') caps.push('-----');
    if (GLs.join() === '') GLs.push('-----');
    if (conChars.join() === '') conChars.push('-----');
    if (conShips.join() === '') conShips.push('-----');

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
