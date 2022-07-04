const { cache } = require('../../cache');

exports.characterAutocomplete = async (interaction, focused) => {
  const choices = cache.characters;

  function isIncluded(value) {
    if (focused.value === '') return true;
    if (value.name.includes(focused.value)) return true;
    if (value.name.toLowerCase().includes(focused.value)) return true;
    return false;
  }

  const filtered = await choices.filter(isIncluded);
  if (filtered.length > 25) return;
  await interaction.respond(
    filtered.map(choice => ({
      name: choice.name,
      value: choice.name,
    }))
  );
};
