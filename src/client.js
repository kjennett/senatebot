const { Client, Collection, Routes, REST, IntentsBitField } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');

const { TOKEN, SENATESERVER, BETASERVER, CLIENT } = process.env;

// Computed absolute paths of event and command directories
// (These will change from Windows dev to Linux prod)
const eventsDir = join(__dirname, './events');
const commandsDir = join(__dirname, './commands');

class SBClient extends Client {
  // --------------------
  // Register Event Listeners
  // --------------------

  registerEventListeners = () => {
    console.info('Registering event listeners...');
    const files = readdirSync(eventsDir);
    for (const file of files) {
      const event = require(`${eventsDir}/${file}`);
      super.on(event.name, (...args) => event.execute(...args));
    }
    console.info('Event listeners registered.');
  };

  // --------------------
  // Command Deployment
  // --------------------

  commands = new Collection();

  deployCommands = async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    // If this variable is set to true, all prior command data for all scopes will be
    // cleared prior to command registration
    const redeploy = true;
    console.info(redeploy ? 'Redeploying clean slash command data...' : 'Registering slash commands...');

    // Separate command JSON data based on the endpoint it will target
    const betaCommandData = [];
    const senateCommandData = [];
    const globalCommandData = [];

    // BETA commands deploy to the "BotDev" beta server
    console.info('Registering BETA-scoped commands...');
    const betaFiles = readdirSync(`${commandsDir}/beta/`);
    for (const file of betaFiles) {
      const module = require(`${commandsDir}/beta/${file}`);
      betaCommandData.push(module.data.toJSON());
      this.commands.set(module.data.name, module);
    }
    if (redeploy) await rest.put(Routes.applicationGuildCommands(CLIENT, BETASERVER), { body: [] });
    await rest.put(Routes.applicationGuildCommands(CLIENT, BETASERVER), { body: betaCommandData });

    // SENATE commands deploy to "The Senate" server
    console.info('Registering SENATE-scoped commands...');
    const senateFiles = readdirSync(`${commandsDir}/senate/`);
    for (const file of senateFiles) {
      const module = require(`${commandsDir}/senate/${file}`);
      senateCommandData.push(module.data.toJSON());
      this.commands.set(module.data.name, module);
    }
    if (redeploy) await rest.put(Routes.applicationGuildCommands(CLIENT, SENATESERVER), { body: [] });
    await rest.put(Routes.applicationGuildCommands(CLIENT, SENATESERVER), { body: commandData });

    // GLOBAL commands deploy to all servers the bot is in, as well as DMs
    console.info('Registering GLOBAL-scoped commands...');
    const globalFiles = readdirSync(`${commandsDir}/global/`);
    for (const file of globalFiles) {
      const module = require(`${commandsDir}/global/${file}`);
      globalCommandData.push(module.data.toJSON());
      this.commands.set(module.data.name, module);
    }
    if (redeploy) await rest.put(Routes.applicationCommands(CLIENT), { body: [] });
    await rest.put(Routes.applicationCommands(CLIENT), { body: commandData });
    console.info(redeploy ? 'Slash commands redeployed.' : 'Slash commands registered.');
  };

  constructor() {
    super({
      intents: new IntentsBitField().add(IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers),
    });
  }
}

module.exports = new SenateBotClient();
