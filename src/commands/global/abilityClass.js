const { db } = require('../../database');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const characterClasses = await db.collections('characters').find().toArray().map((character) => character.ability_classes).flat();
const shipClasses = await db.collections('ships').find().toArray().map((ship) => ship.ability_classes).flat();

// should be an array of the format, I hope
/**
 * [
 *  { name: x, value: x },
 *  { name: y, value: y },
 *  { name: z, value: z },
 *  ...
 * ]
 */
const abilityClasses = [...(new Set(characterClasses.concat(shipClasses)))].map((abilityClass) => { return { name: abilityClass, value: abilityClass } });

const characterTags = await db.collections('characters').find().toArray().map((character) => character.categories).flat();
const shipTags = await db.collections('ships').find().toArray().map((character) => character.categories).flat();
const tags = [...(new Set(characterTags.concat(shipTags)))].map((tag) => { return { name: tag, value: tag } });

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
        .addChoices(...abilityClasses)
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
    )
    .addStringOption(o =>
      o
        .setName('alignment')
        .setDescription('Only units of this alignment.')
        .setRequired(false)
        .addChoices(
          { name: 'Light Side', value: 'Light Side' },
          { name: 'Dark Side', value: 'Dark Side' },
          { name: 'Neutral', value: 'Neutral' },
        )
    )
    .addStringOption(o =>
      o
        .setName('tag')
        .setDescription('Only units with this tag.')
        .setRequired(false)
        .addChoices(...tags)
    ),

  async execute(i) {
    await i.deferReply();
    console.timeEnd(`${i.id} Response`);

    // choose collection from combattype option
    const collection = i.options.getString('combattype') === 'Ground' ? 'characters' : 'ships';
    // get ability class from options
    const abilityClass = i.options.getString('class');

    // query
    // must have ability class
    let query = { ability_classes: abilityClass };
    
    // might have alignment
    const alignment = i.options.getString('alignment');
    const hasAlignment = alignment !== null && alignment !== undefined && alignment !== '';
    if (hasAlignment) query.alignment = alignment;

    // might have tag
    const tag = i.options.getString('tag');
    const hasTag = tag !== null && tag !== undefined && tag !== '';
    if (hasTag) query.categories = tag;

    const units = db.collections(collection).find(query).toArray();

    // end early if no reason to continue;
    const hasAlignmentString = hasAlignment ? `${alignment} ` : '';
    const hasTagString = hasTag ? `with tag ${tag} ` : '';
    const abilityClassString = `with ability class ${abilityClass}`;
    if (units.length === 0) return i.editReply(`No ${hasAlignmentString}${collection} ${hasTagString}found ${abilityClassString}.`);

    // trying to build the search query for .gg
    // lower case ability class
    // replace all non standard characters or whitespace with empty string (remove special characters?)
    // replace any whitespace of 1 or more length with a single -
    const link = abilityClass.toLowerCase().replace(/[^a-z\s]/gi, ' ').replace(/\s+/gi, '-');
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
