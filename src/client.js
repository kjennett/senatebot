const { Client, Collection, Routes, REST, IntentsBitField } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');

const { TOKEN, SERVER, CLIENT } = process.env;

// Computed absolute paths of the events and commands directory
const eventsDir = join(__dirname, './events');
const commandsDir = join(__dirname, './commands');

class SenateBotClient extends Client {
  // Store command names and data for execution later
  commands = new Collection();

  // Read all event handler files in the events directory, register the events to the Discord client
  registerEventHandlers = () => {
    const eventFiles = readdirSync(eventsDir);
    for (const file of eventFiles) {
      const event = require(`${eventsDir}/${file}`);
      if (!event.name) {
        console.info(`Event handler ${file} is missing required property 'name'.`);
        continue;
      }
      super.on(event.name, (...args) => event.execute(...args));
    }
  };

  // Read all command handler files in the commands directory, store the command data
  // for retrieval and execution, and deploy command data to Discord gateway
  deployApplicationCommands = () => {
    const commandData = [];
    const commandFiles = readdirSync(commandsDir);
    for (const file of commandFiles) {
      const commandModule = require(`${commandsDir}/${file}`);
      if (commandModule.enabled) {
        commandData.push(commandModule.data.toJSON());
        this.commands.set(commandModule.data.name, commandModule);
      }
    }
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    return rest.put(Routes.applicationGuildCommands(CLIENT, SERVER), { body: commandData });
  };

  // Create Discord client with appropriate intents
  constructor() {
    super({
      intents: new IntentsBitField().add(IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers),
    });
  }
}

module.exports = new SenateBotClient();
