const { db } = require('../database');
const { client } = require('../bot');
const fetchOmegaAccountData = require('../api/fetchOmegaAccountData');
const fetchGgGuildData = require('../api/fetchGgGuildData');
const { AttachmentBuilder, EmbedBuilder, hyperlink } = require('discord.js');

// --------------------
// Tracked Character IDs
// --------------------

const galacticLegends = [
  'JABBATHEHUTT',
  'LORDVADER',
  'JEDIMASTERKENOBI',
  'GRANDMASTERLUKE',
  'SITHPALPATINE',
  'SUPREMELEADERKYLOREN',
  'GLREY',
];

const conquestCharacters = ['BOBAFETTSCION', 'MAULS7', 'BENSOLO', 'DARTHMALGUS', 'COMMANDERAHSOKA'];

const capitalShips = [
  'CAPITALNEGOTIATOR',
  'CAPITALEXECUTOR',
  'CAPITALPROFUNDITY',
  'CAPITALMALEVOLENCE',
  'CAPITALFINALIZER',
  'CAPITALMONCALAMARICRUISER',
  'CAPITALRADDUS',
  'CAPITALSTARDESTROYER',
  'CAPITALCHIMAERA',
  'CAPITALJEDICRUISER',
];

const conquestShips = ['RAZORCREST', 'SCYTHE', 'TIEINTERCEPTOR'];

// --------------------
// Generate Account Summary
// --------------------

module.exports = async ggData => {
  // Create embed with basic info
  const accountSummaryEmbed = new EmbedBuilder()
    .setDescription(`${ggData.data.ally_code}`)
    .setTitle(`${ggData.data.name}`)
    .setThumbnail(ggData.data.portrait_image)
    .setTimestamp(Date.parse(ggData.data.last_updated))
    .setFooter({ text: 'Source: SWGOH.GG' })
    .setURL(`https://swgoh.gg${ggData.data.url}`)
    .addFields([
      {
        name: 'Galactic Power:',
        value: `${ggData.data.galactic_power.toLocaleString()}`,
      },
    ]);

  // Add GAC data if applicable
  if (ggData.data.level >= 85 && ggData.data.league_name)
    accountSummaryEmbed.addFields([
      {
        name: 'GAC League (Skill Rating):',
        value: `${ggData.data.league_name} ${ggData.data.division_number} (${ggData.data.skill_rating.toLocaleString()})`,
      },
    ]);

  // Add Fleet arena data if applicable
  if (ggData.data.level >= 60 && ggData.data.fleet_arena)
    accountSummaryEmbed.addFields([
      {
        name: 'Fleet Rank (Last Payout):',
        value: `${ggData.data.fleet_arena.rank ?? '-----'}`,
      },
    ]);

  // Fetch ultimate and omicron material emojis
  const ultEmoji = await client.emojis.cache.get('976604889260126248');
  const omiEmoji = await client.emojis.cache.get('984941574439972954');

  // Arrays to hold applicable unit objects
  const caps = [];
  const GLs = [];
  const conChars = [];
  const conShips = [];
  const twOmis = [];
  const tbOmis = [];
  const r9crons = [];

  for (const unit of ggData.units) {
    // Galactic legends
    if (galacticLegends.includes(unit.data.base_id)) {
      const gearLevel = unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
      const ult = unit.data.has_ultimate ? ` ${ultEmoji}` : '';
      GLs.push(`${unit.data.name}: ${gearLevel}${ult}`);
    }

    // Capital ships
    if (capitalShips.includes(unit.data.base_id)) {
      caps.push(`${unit.data.name}: ${unit.data.rarity}:star:`);
    }

    // Conquest characters
    if (conquestCharacters.includes(unit.data.base_id)) {
      const gearLevel = unit.data.gear_level === 13 ? `R${unit.data.relic_tier - 2}` : `G${unit.data.gear_level}`;
      conChars.push(`${unit.data.name}: ${gearLevel}`);
    }

    // Conquest ships
    if (conquestShips.includes(unit.data.base_id)) {
      conShips.push(`${unit.data.name}: ${unit.data.rarity}:star:`);
    }

    // Units with omicron abilities unlocked
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

  // Count Tier 9 datacrons
  for (const cron of ggData.datacrons) {
    if (cron.tier === 9) {
      r9crons.push(hyperlink(`${cron.tiers.at(-1).scope_target_name}`, `https://swgoh.gg/${cron.url}`));
    }
  }

  caps.sort();
  GLs.sort();
  conChars.sort();
  conShips.sort();
  twOmis.sort();
  tbOmis.sort();
  r9crons.sort();

  const numberOfCaps = caps.length;
  const numberOfGLs = GLs.length;
  const numberOfConChars = conChars.length;
  const numberOfConShips = conShips.length;
  const numberOfR9Crons = r9crons.length;

  if (caps.join() === '') caps.push('-----');
  if (GLs.join() === '') GLs.push('-----');
  if (conChars.join() === '') conChars.push('-----');
  if (conShips.join() === '') conShips.push('-----');
  if (twOmis.join() === '') twOmis.push('-----');
  if (tbOmis.join() === '') tbOmis.push('-----');
  if (r9crons.join() === '') r9crons.push('-----');

  accountSummaryEmbed.addFields([
    {
      name: `Galactic Legends: ${numberOfGLs}/${galacticLegends.length}`,
      value: GLs.join('\n'),
    },
    {
      name: `Conquest Characters: ${numberOfConChars}/${conquestCharacters.length}`,
      value: conChars.join('\n'),
    },
    {
      name: `Capital Ships: ${numberOfCaps}/${capitalShips.length}`,
      value: caps.join('\n'),
    },
    {
      name: `Conquest Ships: ${numberOfConShips}/${conquestShips.length}`,
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
  ]);

  // Deal with overflow if too many R9 crons
  if (r9crons.join('\n').length > 1024) {
    accountSummaryEmbed.addFields([
      {
        name: `Tier 9 Datacrons: ${numberOfR9Crons}`,
        value: hyperlink('Click this link to view account datacrons.', `https://swgoh.gg${ggData.data.url}datacrons/`),
      },
    ]);
  } else {
    accountSummaryEmbed.addFields([
      {
        name: `Tier 9 Datacrons: ${numberOfR9Crons}`,
        value: r9crons.join('\n'),
      },
    ]);
  }

  // Add current guild data if available
  if (ggData.data.guild_id) {
    const ggGuildData = await fetchGgGuildData(ggData.data.guild_id);
    const gp = ggGuildData.data.galactic_power / 1000000;
    accountSummaryEmbed.addFields([
      {
        name: 'Current Guild',
        value: hyperlink(
          `${ggGuildData.data.name} - ${gp.toFixed(0)}M GP`,
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

  // Add mod data if available
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
