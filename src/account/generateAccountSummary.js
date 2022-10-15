const config = require('../config');
const { db } = require('../database');
const client = require('../client');
const fetchOmegaAccountData = require('../api/fetchOmegaAccountData');
const fetchGgGuildData = require('../api/fetchGgGuildData');
const { AttachmentBuilder, EmbedBuilder, hyperlink } = require('discord.js');

module.exports = async ggData => {
  const accountSummaryEmbed = new EmbedBuilder().setDescription(`${ggData.data.ally_code}`);

  accountSummaryEmbed
    .setTitle(`${ggData.data.name}`)
    .setThumbnail(ggData.data.portrait_image)
    .setTimestamp(Date.parse(ggData.data.last_updated))
    .setFooter({ text: 'Source: SWGOH.GG // Last Sync Time' })
    .setURL(`https://swgoh.gg${ggData.data.url}`);

  accountSummaryEmbed.addFields([
    {
      name: 'Galactic Power:',
      value: `${ggData.data.galactic_power.toLocaleString()}`,
    },
  ]);

  if (ggData.data.level >= 85 && ggData.data.league_name)
    accountSummaryEmbed.addFields([
      {
        name: 'GAC League (Skill Rating):',
        value: `${ggData.data.league_name} ${ggData.data.division_number} (${ggData.data.skill_rating.toLocaleString()})`,
      },
    ]);

  if (ggData.data.level >= 60 && ggData.data.fleet_arena)
    accountSummaryEmbed.addFields([
      {
        name: 'Fleet Rank (Last Payout):',
        value: `${ggData.data.fleet_arena.rank ?? '-----'}`,
      },
    ]);

  const ultEmoji = await client.emojis.cache.get('976604889260126248');
  const omiEmoji = await client.emojis.cache.get('984941574439972954');

  // Build arrays of various categories of ships and characters
  const caps = [];
  const GLs = [];
  const conChars = [];
  const conShips = [];
  const twOmis = [];
  const tbOmis = [];
  const r9crons = [];

  for (const unit of ggData.units) {
    if (config.galacticLegends.includes(unit.data.base_id)) {
      const gearLevel = unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
      const ult = unit.data.has_ultimate ? ` ${ultEmoji}` : '';
      GLs.push(`${unit.data.name}: ${gearLevel}${ult}`);
    }

    if (config.capitalShips.includes(unit.data.base_id)) {
      caps.push(`${unit.data.name}: ${unit.data.rarity}:star:`);
    }

    if (config.conquestCharacters.includes(unit.data.base_id)) {
      const gearLevel = unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
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

  for (const cron of ggData.datacrons) {
    if (cron.tier === 9) {
      r9crons.push(hyperlink(`${cron.tiers.at(-1).scope_target_name}`, `https://swgoh.gg/${cron.url}`));
    }
  }

  // Alphabetize the list of units and abilities in each category
  caps.sort();
  GLs.sort();
  conChars.sort();
  conShips.sort();
  twOmis.sort();
  tbOmis.sort();
  r9crons.sort();

  // Calculate the number of unlocked unts in each category
  const numberOfCaps = caps.length;
  const numberOfGLs = GLs.length;
  const numberOfConChars = conChars.length;
  const numberOfConShips = conShips.length;
  const numberOfR9Crons = r9crons.length;

  // Add placeholders if the account has no units or abilities unlocked in each category
  if (caps.join() === '') caps.push('-----');
  if (GLs.join() === '') GLs.push('-----');
  if (conChars.join() === '') conChars.push('-----');
  if (conShips.join() === '') conShips.push('-----');
  if (twOmis.join() === '') twOmis.push('-----');
  if (tbOmis.join() === '') tbOmis.push('-----');
  if (r9crons.join() === '') r9crons.push('-----');

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
    {
      name: `Tier 9 Datacrons: ${numberOfR9Crons}`,
      value: r9crons.join('\n'),
    },
  ]);

  if (ggData.data.guild_id) {
    const ggGuildData = await fetchGgGuildData(ggData.data.guild_id);
    const gp = ggGuildData.data.galactic_power / 1000000;
    accountSummaryEmbed.addFields([
      {
        name: 'Current Guild',
        value: hyperlink(
          `${ggGuildData.data.name} - ${gp.toFixed(2)}M GP`,
          `https://swgoh.gg/g/${ggGuildData.data.guild_id}`
        ),
      },
    ]);
  } else {
    accountSummaryEmbed.addFields([
      {
        name: 'Current Guild',
        value: '-----',
      },
    ]);
  }

  const modData = await fetchOmegaAccountData(ggData.data.ally_code);
  let image;
  if (modData) {
    accountSummaryEmbed.addFields([
      {
        name: 'ModQ / Omega',
        value: `${modData.scores.ModQ.toFixed(2)} / ${modData.scores.Omega.toFixed(2)}`,
        inline: true,
      },
    ]);

    image = new AttachmentBuilder(Buffer.from(modData.image, 'base64'), { name: 'modImage.png' });
    accountSummaryEmbed.setImage('attachment://modImage.png');
  }

  if (modData)
    return {
      embeds: [accountSummaryEmbed],
      files: [image],
    };

  return {
    embeds: [accountSummaryEmbed],
  };
};
