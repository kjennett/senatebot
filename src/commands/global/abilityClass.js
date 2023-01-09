const { db } = require('../../database');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const characterOptions = await db.collections('characters').find().toArray().map((character) => character.ability_classes).flat();
const fleetOptions = await db.collections('ships').find().toArray().map((ship) => ship.ability_classes).flat();

// should be an array of the format, I hope
/**
 * [
 *  { name: x, value: x },
 *  { name: y, value: y },
 *  { name: z, value: z },
 *  ...
 * ]
 */
const options = [...(new Set(characterOptions.concat(fleetOptions)))].map((option) => { return { name: option, value: option } });

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('abilityclass')
    .setDescription('List characters with a specific ability class.')
    .addStringOption(o =>
      o
        .setName('class')
        .setDescription('The type of ability class.')
        .setRequired(true)
        .addChoices(...options)
    )
    .addStringOption(o =>
      o
        .setName('combattype')
        .setDescription('Only check abilities for this combat type.')
        .setRequired(true)
        .addChoices(
          { name: 'Ground', value: 'Ground' },
          { name: 'Fleet', value: 'Fleet' }
        )
    ),

  async execute(i) {
    await i.deferReply();
    console.timeEnd(`${i.id} Response`);

    // choose collection from combattype option
    const collection = i.options.getString('combattype') === 'Ground' ? 'characters' : 'ships';
    // get ability class from options
    const abilityClass = i.options.getString('class');

    // query
    const units = db.collections(collection).find({ ability_classes: abilityClass }).toArray();

    // end early if no reason to continue;
    if (units.length === 0) return i.editReply(`No ${collection} found with ability class: ${abilityClass}.`);

    // trying to build the search query for .gg
    // lower case ability class
    // replace all non standard characters or whitespace with empty string (remove special characters?)
    // replace any whitespace of 1 or more length with a single -
    const link = abilityClass.toLowerCase().replace(/[^a-z\s]/gi, '').replace(/\s+/gi, '-');
    const url = `https://swgoh.gg/${collection}/f/${link}/?`;

    // sort characters
    const unitNamesSorted = units.map((unit) => unit.name).sort();

    const embed =
      new EmbedBuilder()
        .setTitle(abilityClass)
        .setURL(url)
        .setDescription(unitNamesSorted.join('\n'));

    await i.editReply({ embeds: [embed] });
  },
};
