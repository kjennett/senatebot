const { Client, Collection, Routes, REST, IntentsBitField } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const { mongo } = require('./database');
const { updateGuildGgDataTask } = require('./tasks/updateGuildGgData');
const updateGameInfo = require('./api/updateGameInfo');
const updateEvents = require('./api/updateEvents');

const { TOKEN, SENATESERVER, BETASERVER, CLIENT } = process.env;

// Computed absolute paths of event and command directories
// (These will change from Windows dev to Linux prod)
const eventsDir = join(__dirname, './events');
const commandsDir = join(__dirname, './commands');

// --------------------
// Discord Client
// --------------------

class SBClient extends Client {
  constructor() {
    super({
      intents: new IntentsBitField().add(
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
      ),
    });
  }

  // --------------------
  // Event Listeners
  // --------------------

  registerEventListeners = () => {
    const files = readdirSync(eventsDir);
    for (const file of files) {
      const event = require(`${eventsDir}/${file}`);
      super.on(event.name, (...args) => event.execute(...args));
    }
  };

  // --------------------
  // Command Deployment
  // --------------------

  commands = new Collection();

  // If this variable is set to true, all prior command data for all scopes will be
  // cleared prior to command registration
  redeploy = true;

  deployCommands = async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    // Separate command JSON data based on the endpoint it will target
    const betaCommandData = [];
    const senateCommandData = [];
    const globalCommandData = [];

    // BETA commands deploy to the "BotDev" beta server
    const betaFiles = readdirSync(`${commandsDir}/beta/`);
    if (betaFiles.length) {
      console.info('Registering BETA-scoped commands...');
      for (const file of betaFiles) {
        const module = require(`${commandsDir}/beta/${file}`);
        betaCommandData.push(module.data.toJSON());
        this.commands.set(module.data.name, module);
      }
      if (this.redeploy) await rest.put(Routes.applicationGuildCommands(CLIENT, BETASERVER), { body: [] });
      await rest.put(Routes.applicationGuildCommands(CLIENT, BETASERVER), { body: betaCommandData });
    }

    // SENATE commands deploy to "The Senate" server
    const senateFiles = readdirSync(`${commandsDir}/senate/`);
    if (senateFiles.length) {
      console.info('Registering SENATE-scoped commands...');
      for (const file of senateFiles) {
        const module = require(`${commandsDir}/senate/${file}`);
        senateCommandData.push(module.data.toJSON());
        this.commands.set(module.data.name, module);
      }
      if (this.redeploy) await rest.put(Routes.applicationGuildCommands(CLIENT, SENATESERVER), { body: [] });
      await rest.put(Routes.applicationGuildCommands(CLIENT, SENATESERVER), { body: senateCommandData });
    }

    // GLOBAL commands deploy to all servers the bot is in, as well as DMs
    const globalFiles = readdirSync(`${commandsDir}/global/`);
    if (globalFiles.length) {
      console.info('Registering GLOBAL-scoped commands...');
      for (const file of globalFiles) {
        const module = require(`${commandsDir}/global/${file}`);
        globalCommandData.push(module.data.toJSON());
        this.commands.set(module.data.name, module);
      }
      if (this.redeploy) await rest.put(Routes.applicationCommands(CLIENT), { body: [] });
      await rest.put(Routes.applicationCommands(CLIENT), { body: globalCommandData });
    }
  };

  // --------------------
  // Bot Startup
  // --------------------

  start = async () => {
    console.info('Starting...');

    await mongo.connect();
    console.info('Connected to MongoDB.');

    await updateGameInfo();
    console.info('Game information updated.');

    await updateEvents();
    console.info('Game events updated.');

    updateGuildGgDataTask.start();
    console.info('Guild data update task scheduled.');

    await this.registerEventListeners();
    console.info('Event listeners registered.');

    await this.deployCommands();
    console.info('Slash commands deployed.');

    await this.login(TOKEN);
    console.info('Connected to Discord gateway.');

    console.info('Startup complete.');
    console.info('--------------------');
  };
}

const client = new SBClient();

// Catch-all logging for Discord client errors
client.on('error', error => console.log(error));

exports.client = client;
client.start();
