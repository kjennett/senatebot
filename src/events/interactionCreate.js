const { log } = require('../log');
const { guildAutocomplete } = require('../functions/autocomplete/guildAutocomplete');
const { tierAutocomplete } = require('../functions/autocomplete/tierAutocomplete');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused(true);
      if (focused.name === 'guild') return guildAutocomplete(interaction, focused);
      if (focused.name === 'tier') return tierAutocomplete(interaction, focused);
    }

    // All interactions that reach this point without being invoked are assumed to be slash commands
    if (!interaction.isCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    log.info(`${interaction.toString()} | User: ${interaction.user.username} | Channel: ${interaction.channel.name}`);

    await command.execute(interaction);
  },
};
