const { SlashCommandBuilder } = require('@discordjs/builders');
const { db } = require('../database');
const { config } = require('../config');
const { MessageEmbed } = require('discord.js');

module.exports = {
  enabled: true,
  hidden: false,

  data: new SlashCommandBuilder()
    .setName('abilityinfo')
    .setDescription('View the in-game information for a character or ship ability.')
    .addStringOption(option =>
      option
        .setName('abilityname')
        .setDescription('The name of the ability to view information about.')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const abilityId = await interaction.options.getString('abilityname');
    const ability = await db.collection('abilities').findOne({ base_id: abilityId });
    if (!abilityId || !ability) return interaction.editReply({ embeds: [config.errorEmbeds.noAbilityFound] });

    const unit = ability.character_base_id
      ? await db.collection('characters').findOne({ base_id: ability.character_base_id })
      : await db.collection('ships').findOne({ base_id: ability.ship_base_id });

    const zetaEmoji = await interaction.client.emojis.cache.get('984941532845056100');
    const omiEmoji = await interaction.client.emojis.cache.get('984941574439972954');

    const zeta = ability.is_zeta ? zetaEmoji : '';
    const omi = ability.is_omicron ? omiEmoji : '';
    let abilityType;
    if (ability.base_id.startsWith('special')) abilityType = 'Special';
    if (ability.base_id.startsWith('basic')) abilityType = 'Basic';
    if (ability.base_id.startsWith('unique')) abilityType = 'Unique';
    if (ability.base_id.startsWith('leader')) abilityType = 'Leader';

    const infoEmbed = new MessageEmbed()
      .setTitle(`Ability: ${ability.name} ${zeta}${omi}`)
      .setThumbnail(ability.image)
      .setDescription(`__${unit.name} ${abilityType} Ability__\n\n${ability.description}`);

    return interaction.editReply({ embeds: [infoEmbed] });
  },
};
