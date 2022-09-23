const { db } = require('../database');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (interaction.isAutocomplete()) {
      const focused = await interaction.options.getFocused(true);

      // Filter choices for those which incclude the partial input
      function isIncluded(value) {
        if (
          focused.value === '' ||
          value.name?.includes(focused.value) ||
          value.name?.toLowerCase().includes(focused.value) ||
          value.abbr?.includes(focused.value) ||
          value.abbr?.toLowerCase().includes(focused.value)
        ) {
          return true;
        } else {
          return false;
        }
      }

      // Autocomplete based on the names of registered guilds
      if (focused.name === 'guild') {
        const choices = await db.collection('guilds').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(
            filtered.map(choice => ({
              name: `${choice.name} (${choice.abbr})`,
              value: choice.name,
            }))
          );
      }

      // Autocomplete based on the number of registered recruitment tiers
      if (focused.name === 'tier') {
        const choices = await db.collection('tiers').find().sort({ number: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(
            filtered.map(choice => ({
              name: `Tier ${choice.number}`,
              value: choice.number,
            }))
          );
      }

      // Autocomplete based on the names of unit abilities
      if (focused.name === 'abilityname') {
        const choices = await db.collection('abilities').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(
            filtered.map(choice => ({
              name: `${choice.name} (${choice.character_base_id ?? choice.ship_base_id})`,
              value: choice.base_id,
            }))
          );
      }

      // Autocomplete based on the names of characters
      if (focused.name === 'charactername') {
        const choices = await db.collection('characters').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.base_id })));
      }

      // Autocomplete based on the names of ships
      if (focused.name === 'shipname') {
        const choices = await db.collection('ships').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.base_id })));
      }
    }

    if (!interaction.isCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    // Log command input, user, and channel
    console.info(`${interaction.toString()} | User: ${interaction.user.username} | Channel: ${interaction.channel.name}`);

    await command.execute(interaction);
  },
};
