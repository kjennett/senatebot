const { Client, Collection, Routes, REST, IntentsBitField } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');

const { TOKEN, SERVER, CLIENT } = process.env;

const eventsDir = join(__dirname, './events');
const commandsDir = join(__dirname, './commands');

class SenateBotClient extends Client {
  twActive = false;
  gacActive = false;

  registerEvents = () => {
    const files = readdirSync(eventsDir);
    for (const file of files) {
      const event = require(`${eventsDir}/${file}`);
      super.on(event.name, (...args) => event.execute(...args));
    }
  };

  commands = new Collection();
  deployCommands = () => {
    const commandData = [];
    const files = readdirSync(commandsDir);
    for (const file of files) {
      const module = require(`${commandsDir}/${file}`);
      if (module.enabled) {
        commandData.push(module.data.toJSON());
        this.commands.set(module.data.name, module);
      }
    }
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    return rest.put(Routes.applicationGuildCommands(CLIENT, SERVER), { body: commandData });
  };

  constructor() {
    super({
      intents: new IntentsBitField().add(IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers),
    });
  }
}

module.exports = new SenateBotClient();
