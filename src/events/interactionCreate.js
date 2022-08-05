const { dbGuilds, dbTiers, dbAbilities, dbCharacters, dbShips } = require('../database');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (interaction.isAutocomplete()) {
      const focused = await interaction.options.getFocused(true);

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

      if (focused.name === 'guild') {
        const choices = await dbGuilds.find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(
            filtered.map(choice => ({
              name: `${choice.name} (${choice.abbr})`,
              value: choice.name,
            }))
          );
      }

      if (focused.name === 'tier') {
        const choices = await dbTiers.find().sort({ number: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(
            filtered.map(choice => ({
              name: `Tier ${choice.number}`,
              value: choice.number,
            }))
          );
      }

      if (focused.name === 'abilityname') {
        const choices = await dbAbilities.find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(
            filtered.map(choice => ({
              name: `${choice.name} (${choice.character_base_id ?? choice.ship_base_id})`,
              value: choice.base_id,
            }))
          );
      }

      if (focused.name === 'charactername') {
        const choices = await dbCharacters.find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.base_id })));
      }

      if (focused.name === 'shipname') {
        const choices = await dbShips.find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.base_id })));
      }
    }

    if (!interaction.isCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    console.info(`${interaction.toString()} | User: ${interaction.user.username} | Channel: ${interaction.channel.name}`);

    await command.execute(interaction);
  },
};
