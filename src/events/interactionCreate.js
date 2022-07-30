const { db } = require('../database');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (interaction.isAutocomplete()) {
      const focused = await interaction.options.getFocused(true);

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

      if (focused.name === 'guildname') {
        const choices = await db.collection('guilds').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        await interaction.respond(
          filtered.map(choice => ({
            name: `${choice.name} (${choice.abbr})`,
            value: choice.name,
          }))
        );
      }

      if (focused.name === 'tiernumber') {
        const choices = await db.collection('tiers').find().sort({ number: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        await interaction.respond(
          filtered.map(choice => ({
            name: `Tier ${choice.number}`,
            value: choice.number,
          }))
        );
      }
    }

    if (!interaction.isCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    console.info(`${interaction.toString()} | User: ${interaction.user.username} | Channel: ${interaction.channel.name}`);

    await command.execute(interaction);
  },
};
