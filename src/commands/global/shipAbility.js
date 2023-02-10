const { db } = require('../../database');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shipability')
    .setDescription('View information about an in-game CHARACTER ability.')
    .addStringOption(o =>
      o
        .setName('shipname')
        .setDescription('The name of the character to view ability information about.')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(o =>
      o
        .setName('type')
        .setDescription('If there are multiple abilities of the given type, all abilities will be shown.')
        .setRequired(true)
        .addChoices(
          { name: 'Basic', value: 'Basic' },
          { name: 'Special', value: 'Special' },
          { name: 'Unique', value: 'Unique' },
          { name: 'Hardware', value: 'Hardware' }
        )
    ),

  async execute(i) {
    await i.deferReply();

    // List of embeds to be displayed, one for each ability
    const embeds = [];

    // Pull database entry for the character
    const ship = await db.collection('ships').findOne({ base_id: i.options.getString('shipname') });
    if (!ship) return i.editReply('Unable to find a ship with the provided name.');

    // Pull all abilities for that character, and filter to the selected type
    const allAbilities = await db
      .collection('abilities')
      .find({ ship_base_id: ship.base_id })
      .sort({ base_id: 1 })
      .toArray();
    const abilities = allAbilities.filter(abi => abi.base_id.includes(i.options.getString('type').toLowerCase()));
    if (abilities.length === 0)
      return i.editReply(`No ${i.options.getString('type')} abilities were found for ${ship.name}`);

    for (const ability of abilities) {
      const abilityDisplay = new EmbedBuilder()
        .setTitle(ability.name)
        .setThumbnail(ability.image)
        .setURL(`https:${ability.url}`)
        .setDescription(
          `${ship.name} ${i.options.getString('type')} Ability\n\n${ability.description.replace(/\[.{6}\]/gm, '')}`
        );

      embeds.push(abilityDisplay);
    }

    await i.editReply({ embeds: embeds });
  },
};
