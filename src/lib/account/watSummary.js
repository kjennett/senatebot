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
        ? `Power: ${gba.data.power.toLocaleString()} :white_check_mark:`
        : `Power: ${gba.data.power.toLocaleString()} :no_entry_sign:\n -- Required: 16,500+`
    );

    // Check Gear Level
    if (gba.data.gear_level >= 12) {
      // Show Relic level
      if (gba.data.gear_level === 13) {
        gbaRecs.push(`Relic Level: ${gba.data.relic_tier - 2} :white_check_mark:`);
      } else {
        gbaRecs.push(`Gear Level: ${gba.data.gear_level} :white_check_mark:`);
      }
    } else {
      gbaRecs.push(
        `Gear Level: ${gba.data.gear_level} :hammer:\n -- G12+ is __strongly__ recommended\n -- Relic tiers will add additional consistency`
      );
    }

    // Check Zetas
    let unlockedZetas = 0;
    const queensWill = gba.data.ability_data[5].has_zeta_learned;
    const geonosianSwarm = gba.data.ability_data[4].has_zeta_learned;
    if (queensWill) unlockedZetas++;
    if (geonosianSwarm) unlockedZetas++;
    if (unlockedZetas === 0) gbaRecs.push(`Zetas: 0 :no_entry_sign:`);
    if (unlockedZetas === 1) gbaRecs.push(`Zetas: 1 :hammer:`);
    if (unlockedZetas === 2) gbaRecs.push(`Zetas: 2 :white_check_mark:`);
    if (!queensWill) gbaRecs.push(" -- Queen's Will Zeta is nearly mandatory");
    if (!geonosianSwarm) gbaRecs.push('Geonosian Swarm Zeta is __strongly recommended__');

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
