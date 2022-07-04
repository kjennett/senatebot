const { db } = require('../../database');

exports.tierAutocomplete = async (interaction, focused) => {
  const choices = await db.collection('tiers').find().sort({ number: 1 }).toArray();

  function isIncluded(value) {
    if (focused.value === '') return true;
    if (value.number === focused.value) return true;
    if (`${value.number}` === `${focused.value}`) return true;
    if (`${focused.value}`.includes(`${value}`)) return true;
    return false;
  }

  const filtered = await choices.filter(isIncluded);
  await interaction.respond(
    filtered.map(choice => ({
      name: `Tier ${choice.number}`,
      value: choice.number,
    }))
  );
};
