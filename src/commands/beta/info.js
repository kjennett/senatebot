const { db } = require('../../database');
const config = require('../../config');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('View information about characters, ships, abilities, and game events.')
    .addSubcommand(sub1 =>
      sub1
        .setName('ability')
        .setDescription('Information about a specific in-game ability.')
        .addStringOption(option =>
          option
            .setName('abilityname')
            .setDescription('The name of the ability to view information about.')
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand(sub2 =>
      sub2
        .setName('character')
        .setDescription('Information about an in-game character.')
        .addStringOption(option =>
          option
            .setName('charactername')
            .setDescription('The name of the character to fetch information about.')
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand(sub3 =>
      sub3
        .setName('ship')
        .setDescription('Information about an in-game ship.')
        .addStringOption(option =>
          option
            .setName('shipname')
            .setDescription('The name of the ship to fetch information about.')
            .setAutocomplete(true)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const sub = await interaction.options.getSubcommand();

    if (sub === 'ability') {
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
      if (ability.base_id.includes('special')) abilityType = 'Special';
      if (ability.base_id.includes('basic')) abilityType = 'Basic';
      if (ability.base_id.includes('unique')) abilityType = 'Unique';
      if (ability.base_id.includes('leader')) abilityType = 'Leader';
      if (ability.base_id.includes('granted')) abilityType = 'Granted';

      const infoEmbed = new EmbedBuilder()
        .setTitle(`Ability: ${ability.name} ${zeta} ${omi}`)
        .setThumbnail(ability.image)
        .setDescription(`${unit.name} ${abilityType} Ability\n\n${ability.description.replace(/\[.{6}\]/gm, '')}`)
        .setURL(`https:${ability.url}`);

      return interaction.editReply({ embeds: [infoEmbed] });
    }

    if (sub === 'character') {
      const characterId = await interaction.options.getString('charactername');
      const character = await db.collection('characters').findOne({ base_id: characterId });
      if (!characterId || !character) return interaction.editReply({ embeds: [config.errorEmbeds.noCharacterFound] });

      const zetaEmoji = await interaction.client.emojis.cache.get('984941532845056100');
      const omiEmoji = await interaction.client.emojis.cache.get('984941574439972954');

      const abilities = await db
        .collection('abilities')
        .find({ character_base_id: characterId })
        .sort({ base_id: 1 })
        .toArray();

      const infoEmbed = new EmbedBuilder()
        .setTitle(`Character: ${character.name}`)
        .setURL(character.url)
        .setDescription(character.description)
        .setThumbnail(character.image)
        .addFields([
          {
            name: 'Alignment',
            value: character.alignment,
          },
          {
            name: 'Tags',
            value: character.categories.join(', '),
          },
        ]);

      for (const ability of abilities) {
        const zeta = ability.is_zeta ? zetaEmoji : '';
        const omi = ability.is_omicron ? omiEmoji : '';
        let abilityType;
        if (ability.base_id.includes('special')) abilityType = 'Special';
        if (ability.base_id.includes('basic')) abilityType = 'Basic';
        if (ability.base_id.includes('unique')) abilityType = 'Unique';
        if (ability.base_id.includes('leader')) abilityType = 'Leader';
        if (ability.base_id.includes('granted')) abilityType = 'Granted';

        infoEmbed.addFields([
          {
            name: `${abilityType} Ability`,
            value: `${ability.name} ${zeta} ${omi}`,
          },
        ]);
      }

      return interaction.editReply({ embeds: [infoEmbed] });
    }

    if (sub === 'ship') {
      const shipId = await interaction.options.getString('shipname');
      const ship = await db.collection('ships').findOne({ base_id: shipId });
      if (!shipId || !ship) return interaction.editReply({ embeds: [config.errorEmbeds.noShipFound] });

      const abilities = await db.collection('ships').find({ ship_base_id: shipId }).sort({ base_id: 1 }).toArray();

      const infoEmbed = new EmbedBuilder()
        .setTitle(`Ship: ${ship.name}`)
        .setURL(ship.url)
        .setDescription(ship.description)
        .setThumbnail(ship.image)
        .addFields([
          {
            name: 'Tags',
            value: ship.categories.join(', '),
          },
        ]);

      for (const ability of abilities) {
        let abilityType;
        if (ability.base_id.includes('special')) abilityType = 'Special';
        if (ability.base_id.includes('basic')) abilityType = 'Basic';
        if (ability.base_id.includes('unique')) abilityType = 'Unique';
        if (ability.base_id.includes('leader')) abilityType = 'Leader';
        if (ability.base_id.includes('granted')) abilityType = 'Granted';
        if (ability.base_id.includes('hardware')) abilityType = 'Hardware';

        infoEmbed.addFields([
          {
            name: `${abilityType} Ability`,
            value: `${ability.name}`,
          },
        ]);
      }

      return interaction.editReply({ embeds: [infoEmbed] });
    }
  },
};
