const { db } = require('../../database');

exports.guildAutocomplete = async (interaction, focused) => {
  const choices = await db.collection('guilds').find().sort({ name: 1 }).toArray();

  function isIncluded(value) {
    if (
      focused.value === '' ||
      value.name.includes(focused.value) ||
      value.name.toLowerCase().includes(focused.value) ||
      value.abbr.includes(focused.value) ||
      value.abbr.toLowerCase().includes(focused.value)
    )
      return true;
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
