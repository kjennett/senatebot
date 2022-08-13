const { REST } = require('@discordjs/rest');
const { Client, Collection, Intents } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
const { readdirSync } = require('fs');
const { join } = require('path');

const { TOKEN, SERVER, CLIENT } = process.env;

// Computed absolute paths of events and commands directories
const eventsDir = join(__dirname, './events');
const commandsDir = join(__dirname, './commands');

class SenateBotClient extends Client {
  // Stored command data for execution
  commands = new Collection();

  // Register Discord event handlers
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

  // Deploy application commands to Discord gateway
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
    const rest = new REST({ version: 10 }).setToken(TOKEN);
    return rest.put(Routes.applicationGuildCommands(CLIENT, SERVER), { body: commandData });
  };

  constructor() {
    super({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });
  }
}

exports.client = new SenateBotClient();
