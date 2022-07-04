const { log } = require('../log');
const { guildAutocomplete } = require('../functions/autocomplete/guildAutocomplete');
const { tierAutocomplete } = require('../functions/autocomplete/tierAutocomplete');
const { characterAutocomplete } = require('../functions/autocomplete/characterAutocomplete');
const { shipAutocomplete } = require('../functions/autocomplete/shipAutocomplete');
const { effectAutocomplete } = require('../functions/autocomplete/effectAutocomplete');

module.exports = {
  name: 'interactionCreate',
  on: true,
  async execute(interaction) {
    // Invoke handler functions for any new autocomplete parameters here
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused(true);
      if (focused.name === 'guild') return guildAutocomplete(interaction, focused);
      if (focused.name === 'tier') return tierAutocomplete(interaction, focused);
      if (focused.name === 'character') return characterAutocomplete(interaction, focused);
      if (focused.name === 'ship') return shipAutocomplete(interaction, focused);
      if (focused.name === 'effect') return effectAutocomplete(interaction, focused);
    }

    // All interactions that reach this point without being invoked are assumed to be slash commands
    if (!interaction.isCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    // This aids with troubleshooting - especially channel names.
    // TODO: Could parameter input values be included here as well?
    log.info(
      `Command: ${interaction.commandName} ${(await interaction.options.getSubcommand()) ?? ''} | User: ${
        interaction.user.username
      } | Channel: ${interaction.channel.name}`
    );

    await command.execute(interaction);
  },
};
