const { EmbedBuilder } = require('discord.js');

exports.watSummary = async ggData => {
  const watSummaryEmbed = new EmbedBuilder()
    .setTitle(`Wat Readiness: ${ggData.data.name}`)
    .setDescription(`${ggData.data.ally_code}`)
    .setThumbnail(ggData.data.portrait_image)
    .setTimestamp(Date.parse(ggData.data.last_updated))
    .setFooter({ text: 'Source: SWGOH.GG' })
    .setURL(`https://swgoh.gg${ggData.data.url}`);

  const gbaRecs = [];

  const gbaCharacter = ggData.units.filter(unit => unit.data.base_id === 'GEONOSIANBROODALPHA');
  if (gbaCharacter.length) {
    const gba = gbaCharacter[0];

    // Check Galactic Power
    gbaRecs.push(
      gba.data.power >= 16500
        ? `Power: ${gba.data.power.toLocaleString()} :white_check_mark:\n`
        : `Power: ${gba.data.power.toLocaleString()} :no_entry_sign:\n -- Required: 16,500+\n`
    );

    // Check Gear Level
    if (gba.data.gear_level >= 12) {
      // Show Relic level
      if (gba.data.gear_level === 13) {
        gbaRecs.push(`Relic Level: ${gba.data.relic_tier - 2} :white_check_mark:\n`);
      } else {
        gbaRecs.push(`Gear Level: ${gba.data.gear_level} :white_check_mark:\n`);
      }
    } else {
      gbaRecs.push(
        `Gear Level: ${gba.data.gear_level} :hammer:\n -- G12+ is __strongly__ recommended\n -- Relic tiers will add consistency\n`
      );
    }

    // Check Zetas
    const unlockedZetas = gba.data.zeta_abilities.length;
    const queensWill = gba.data.zeta_abilities.includes('uniqueskill_GEONOSIANBROODALPHA01');
    const geonosianSwarm = gba.data.zeta_abilities.includes('leaderskill_GEONOSIANBROODALPHA');
    gbaRecs.push(
      unlockedZetas === 2
        ? gbaRecs.push(`Zetas: 2 :white_check_mark:`)
        : unlockedZetas === 1
        ? `Zetas: 1 :hammer:`
        : `Zetas: 0 :no_entry_sign:`
    );
    if (!queensWill) {
      if (geonosianSwarm) gbaRecs.push(" -- Queen's Will Zeta is __nearly mandatory__\n");
      else gbaRecs.push(" -- Queen's Will Zeta is nearly mandatory");
    }
    if (!geonosianSwarm) gbaRecs.push(' -- Geonosian Swarm Zeta is __strongly recommended__');

    // Check Stats / Mods?

    watSummaryEmbed.addFields([{ name: 'Geonosian Brood Alpha', value: gbaRecs.join('\n') }]);
  } else {
    gbaRecs.push('Not Unlocked!');
    watSummaryEmbed.addFields([{ name: 'Geonosian Brood Alpha', value: gbaRecs.join('\n') }]);
  }

  return {
    embeds: [watSummaryEmbed],
  };
};
