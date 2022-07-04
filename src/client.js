const { REST } = require('@discordjs/rest');
const { Client, Collection, Intents } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
const { readdirSync } = require('fs');
const { join } = require('path');

class SenateBotClient extends Client {
  commands = new Collection();

  registerEventHandlers = () => {
    const eventFiles = readdirSync(join(__dirname, './events'));
    for (const file of eventFiles) {
      const event = require(join(__dirname, `./events/${file}`));
      if (event.once) {
        super.once(event.name, (...args) => event.execute(...args));
      } else {
        super.on(event.name, (...args) => event.execute(...args));
      }
    }
  };

  deployApplicationCommands = () => {
    this.commands.clear();
    const commandData = [];
    const commandFiles = readdirSync(join(__dirname, './commands'));
    for (const file of commandFiles) {
      const commandModule = require(join(__dirname, `./commands/${file}`));
      if (commandModule.enabled) {
        commandData.push(commandModule.data.toJSON());
        this.commands.set(commandModule.data.name, commandModule);
      }
    }
    const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);
    return rest.put(Routes.applicationGuildCommands(process.env.CLIENT, process.env.SERVER), { body: commandData });
  };

  start = async () => {
    await this.registerEventHandlers();
    await this.deployApplicationCommands();
    await this.login(process.env.TOKEN);
  };

  constructor() {
    super({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS],
    });
  }
}

exports.client = new SenateBotClient();
