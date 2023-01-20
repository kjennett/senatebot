const { Client, Collection, Routes, REST, IntentsBitField } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const { mongo } = require('./database');

const { TOKEN, SENATESERVER, CLIENT } = process.env;

// Need to compute these relative paths dynamically - they will
// change from dev environment to production
const eventsDir = join(__dirname, './events');
const commandsDir = join(__dirname, './commands');
const tasksDir = join(__dirname, './tasks');

class SBClient extends Client {
  constructor() {
    super({
      intents: new IntentsBitField().add(
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages
      ),
    });

    this.on('error', error => console.log(error));
  }

  registerEventListeners = () => {
    const files = readdirSync(eventsDir);
    for (const file of files) {
      const event = require(`${eventsDir}/${file}`);
      super.on(event.name, (...args) => event.execute(...args));
    }
  };

  commands = new Collection();

  /** If true, will force clear all command data from Discord before deploy */
  redeploy = false;

  deployCommands = async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    const senateCommandData = [];
    const globalCommandData = [];

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
    await mongo.connect();
    await this.scheduleTasks();
    await this.registerEventListeners();
    await this.deployCommands();
    await this.login(TOKEN);
    console.info('----- Startup Complete -----');
  };
}

exports.client = new SBClient();
exports.client.start();
