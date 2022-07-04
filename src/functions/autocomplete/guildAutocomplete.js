const { db } = require('../../database');

exports.guildAutocomplete = async (interaction, focused) => {
  const choices = await db.collection('guilds').find().sort({ name: 1 }).toArray();

  function isIncluded(value) {
    if (focused.value === '') return true;
    if (value.name.includes(focused.value)) return true;
    if (value.name.toLowerCase().includes(focused.value)) return true;
    if (value.abbr.includes(focused.value)) return true;
    if (value.abbr.toLowerCase().includes(focused.value)) return true;
    return false;
  }

  const filtered = await choices.filter(isIncluded);
  await interaction.respond(
    filtered.map(choice => ({
      name: `${choice.name} (${choice.abbr})`,
      value: choice.name,
    }))
  );
};
