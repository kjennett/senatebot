const { db } = require('../../database');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('charability')
    .setDescription('View information about an in-game CHARACTER ability.')
    .addStringOption(o =>
      o
        .setName('charactername')
        .setDescription('The name of the character to view ability information about.')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(o =>
      o
        .setName('abilitytype')
        .setDescription('If there are multiple abilities of the given type, all abilities will be shown.')
        .setRequired(true)
        .addChoices(
          { name: 'Basic', value: 'Basic' },
          { name: 'Special', value: 'Special' },
          { name: 'Unique', value: 'Unique' },
          { name: 'Leader', value: 'Leader' },
          { name: 'Granted', value: 'Granted' }
        )
    ),

  async execute(i) {
    await i.deferReply();

    // List of embeds to be displayed, one for each ability
    const embeds = [];

    // Pull database entry for the character
    const char = await db.collection('characters').findOne({ base_id: i.options.getString('charactername') });
    if (!char) return i.editReply('Unable to find a character with the provided name.');

    // Pull all abilities for that character, and filter to the selected type
    const allAbilities = await db
      .collection('abilities')
      .find({ character_base_id: char.base_id })
      .sort({ base_id: 1 })
      .toArray();
    const abilities = allAbilities.filter(abi => abi.base_id.includes(i.options.getString('abilitytype').toLowerCase()));
    if (abilities.length === 0)
      return i.editReply(`No ${i.options.getString('abilitytype')} abilities were found for ${char.name}`);

    const zetaEmoji = await i.client.emojis.cache.get('984941532845056100');
    const omiEmoji = await i.client.emojis.cache.get('984941574439972954');

    for (const ability of abilities) {
      const zeta = ability.is_zeta ? zetaEmoji : '';
      const omi = ability.is_omicron ? omiEmoji : '';

      const abilityDisplay = new EmbedBuilder()
        .setName(`${ability.name} ${zeta} ${omi}`)
        .setThumbnail(ability.image)
        .setURL(`https:${ability.url}`)
        .setDescription(
          `${char.name} ${i.options.getString('abilitytype')} Ability\n\n${ability.description.replace(/\[.{6}\]/gm, '')}`
        );

      embeds.push(abilityDisplay);
    }

    await i.editReply({ embeds: embeds });
  },
};
