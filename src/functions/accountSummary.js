const { config } = require('../config');
const { client } = require('../client');
const { newEmbed } = require('./newEmbed');
const { fetchGG, fetchHelp, fetchOmega } = require('./gamedata/playerData');
const { MessageAttachment } = require('discord.js');
const { cache } = require('../cache');

const legends = Object.keys(config.galacticLegends);
const capships = Object.keys(config.capitalShips);

exports.generateAccountSummary = async parsedAllyCode => {
  let playerData = await fetchGG(parsedAllyCode);
  const accountSummaryEmbed = await newEmbed();
  accountSummaryEmbed.setDescription(`Ally Code: ${parsedAllyCode}`);

  if (playerData) {
    accountSummaryEmbed.setTitle(`Account Summary: ${playerData.data.name}`);
    accountSummaryEmbed.setFooter({
      text: 'Source: SWGOH.GG',
      iconURL: process.env.SENATELOGO,
    });
    accountSummaryEmbed.setTimestamp(new Date(playerData.data.last_updated));

    accountSummaryEmbed.addField('Galactic Power:', `${playerData.data.galactic_power.toLocaleString()}`);

    if (playerData.data.level >= 85 && playerData.data.league_name)
      accountSummaryEmbed.addField(
        'GAC League (SR):',
        `${playerData.data.league_name} ${
          playerData.data.division_number
        } (${playerData.data.skill_rating.toLocaleString()})`
      );

    if (playerData.data.level >= 60 && playerData.data.fleet_arena)
      accountSummaryEmbed.addField('Fleet Rank (Last Payout):', `${playerData.data.fleet_arena.rank ?? '-----'}`);

    const ultEmoji = await client.emojis.cache.get('976604889260126248');
    const omiEmoji = await client.emojis.cache.get('984941574439972954');

    const caps = [];
    const GLs = [];
    const twOmis = [];
    const tbOmis = [];

    for (const unit of playerData.units) {
      if (unit.data.omicron_abilities.length) {
        const learnedOmicrons = unit.data.ability_data.filter(ability => ability.has_omicron_learned);
        for (const omicron of learnedOmicrons) {
          const cachedAbility = cache.abilities.find(element => element.base_id === omicron.id);
          if (cachedAbility.omicron_mode === config.omicronModes.TB) {
            const cachedUnit = cache.characters.find(element => element.base_id === cachedAbility.character_base_id);
            if (cachedUnit) tbOmis.push(`${cachedUnit.name}: ${cachedAbility.name} ${omiEmoji}`);
          }
          if (cachedAbility.omicron_mode === config.omicronModes.TW) {
            const cachedUnit = cache.characters.find(element => element.base_id === cachedAbility.character_base_id);
            if (cachedUnit) twOmis.push(`${cachedUnit.name}: ${cachedAbility.name} ${omiEmoji}`);
          }
        }
      }

      if (unit.data.is_galactic_legend) {
        const gearLevel = unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
        const ult = unit.data.has_ultimate ? ` ${ultEmoji}` : '';

        GLs.push(`${config.galacticLegends[unit.data.base_id].name} (${gearLevel})${ult}`);
      }

      if (capships.includes(unit.data.base_id)) {
        caps.push(`${config.capitalShips[unit.data.base_id].name} ${unit.data.rarity}:star:`);
      }
    }

    caps.sort();
    GLs.sort();
    twOmis.sort();
    tbOmis.sort();

    const numberOfCaps = caps.length;
    const numberOfGLs = GLs.length;
    const numberOfTWOmis = twOmis.length;
    const numberOfTBOmis = tbOmis.length;

    if (caps.join() === '') caps.push('-----');
    if (GLs.join() === '') GLs.push('-----');
    if (twOmis.join() === '') twOmis.push('-----');
    if (tbOmis.join() === '') tbOmis.push('-----');

    accountSummaryEmbed
      .addField(`Galactic Legends: ${numberOfGLs}`, GLs.join('\n'))
      .addField(`Capital Ships: ${numberOfCaps}`, caps.join('\n'))
      .addField(`TW Omicrons: ${numberOfTWOmis}`, twOmis.join('\n'))
      .addField(`TB Omicrons: ${numberOfTBOmis}`, tbOmis.join('\n'))
      .addField('SWGOH.gg Profile:', `https://swgoh.gg/p/${parsedAllyCode}`);

    const modSummaryEmbed = await newEmbed()
      .setTitle(`Mod Data: ${playerData.data.name}`)
      .setFooter({ text: '', iconURL: '' });

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
      const image = new MessageAttachment(Buffer.from(modData.image, 'base64'), 'modgraph.png');
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
      .addField('Galactic Power:', `${playerData.stats[0].value.toLocaleString()}`);

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

      accountSummaryEmbed.addField('GAC League:', `${league} ${division}`);
    } else {
      accountSummaryEmbed.addField('GAC League:', '-----');
    }
    if (playerData.level >= 85) accountSummaryEmbed.addField('Fleet Rank (Real Time):', `${playerData.arena.ship.rank}`);

    const caps = [];
    const GLs = [];

    for (const unit of playerData.roster) {
      if (legends.includes(unit.defId)) {
        if (unit.relic.currentTier > 2) {
          GLs.push(`${config.galacticLegends[unit.defId].name} (R${unit.relic.currentTier - 2})`);
        } else {
          GLs.push(`${config.galacticLegends[unit.defId].name} (G${unit.gear})`);
        }
      }
      if (capships.includes(unit.defId)) {
        caps.push(`${config.capitalShips[unit.defId].name} ${unit.rarity}:star:`);
      }
    }

    if (caps.join() === '') caps.push('-----');
    if (GLs.join() === '') GLs.push('-----');

    accountSummaryEmbed.addField('Galactic Legends:', GLs.join('\n')).addField('Capital Ships:', caps.join('\n'));

    return { embeds: [accountSummaryEmbed] };
  }
};
