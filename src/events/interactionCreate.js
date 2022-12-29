const { db } = require('../database');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    console.log(`Time to command execution: ${interaction.createdTimestamp - Date.now()} ms`);
    console.time('Command Response');
    if (interaction.isCommand()) {
      console.log(
        `User: ${interaction.member.displayName} | Command: ${interaction.toString()} | Channel: ${
          interaction.channel.name
        }`
      );
      const command = interaction.client.commands.get(interaction.commandName);
      await command.execute(interaction);
    }

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

      if (focused.name === 'charactername') {
        const choices = await db.collection('characters').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(
            filtered.map(choice => ({ name: choice.name, value: choice.base_id }))
          );
      }

      if (focused.name === 'shipname') {
        const choices = await db.collection('ships').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await interaction.respond(
            filtered.map(choice => ({ name: choice.name, value: choice.base_id }))
          );
      }
    }
  },
};
