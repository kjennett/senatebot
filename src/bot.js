const { Client, Collection, Routes, REST, IntentsBitField } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const { mongo } = require('./database');

const { TOKEN, SENATESERVER, CLIENT } = process.env;

// Computed absolute paths of task, event and command directories
// (These will change from Windows dev to Linux prod)
const eventsDir = join(__dirname, './events');
const commandsDir = join(__dirname, './commands');
const tasksDir = join(__dirname, './tasks');

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

  registerEventListeners = () => {
    const files = readdirSync(eventsDir);
    for (const file of files) {
      const event = require(`${eventsDir}/${file}`);
      super.on(event.name, (...args) => event.execute(...args));
    }
  };

  commands = new Collection();

  // If this variable is set to true, all prior command data for all scopes will be
  // cleared prior to command registration
  redeploy = false;

  deployCommands = async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    const senateCommandData = [];
    const globalCommandData = [];

    // SENATE commands deploy to "The Senate" server
    const senateFiles = readdirSync(`${commandsDir}/senate/`);
    if (senateFiles.length) {
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
      for (const file of globalFiles) {
        const module = require(`${commandsDir}/global/${file}`);
        globalCommandData.push(module.data.toJSON());
        this.commands.set(module.data.name, module);
      }
      if (this.redeploy) await rest.put(Routes.applicationCommands(CLIENT), { body: [] });
      await rest.put(Routes.applicationCommands(CLIENT), { body: globalCommandData });
    }
  };

  scheduleTasks = () => {
    const taskFiles = readdirSync(`${tasksDir}`);
    if (taskFiles.length) {
      for (const file of taskFiles) {
        require(`${tasksDir}/${file}`);
      }
    }
  };

  start = async () => {
    console.info('--------------------');
    console.info('Starting...');

    await mongo.connect();

    await this.scheduleTasks();
    await this.registerEventListeners();
    await this.deployCommands();

    await this.login(TOKEN);

    console.info('Startup complete.');
    console.info('--------------------');
  };
}

const client = new SBClient();

// Catch-all logging for Discord client errors
client.on('error', error => console.log(error));

exports.client = client;
client.start();
