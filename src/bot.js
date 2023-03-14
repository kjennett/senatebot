const { Client, Collection, Routes, REST, IntentsBitField } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const { mongo } = require('./database');

/* ------------------- Discord Client ------------------- */

class SBClient extends Client {
  constructor() {
    super({
      intents: new IntentsBitField().add(
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages
      ),
    });
  }

  /* -------------- Command Data Collection ------------- */

  commands = new Collection();

  /* ----------------- Startup Processes ---------------- */

  registerEventListeners = () => {
    const eventsFolder = join(__dirname, './events');
    const files = readdirSync(eventsFolder);

    for (const file of files) {
      const event = require(`${eventsFolder}/${file}`);
      super.on(event.name, (...args) => event.execute(...args));
    }
  };

  deployCommands = async () => {
    const commandsFolder = join(__dirname, './commands');
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    const senateCommandData = [];
    const senateFiles = readdirSync(`${commandsFolder}/senate/`);

    if (senateFiles.length) {
      for (const file of senateFiles) {
        const module = require(`${commandsFolder}/senate/${file}`);
        senateCommandData.push(module.data.toJSON());
        this.commands.set(module.data.name, module);
      }
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT, process.env.SENATESERVER), {
        body: senateCommandData,
      });
    }

    const globalCommandData = [];
    const globalFiles = readdirSync(`${commandsFolder}/global/`);

    if (globalFiles.length) {
      for (const file of globalFiles) {
        const module = require(`${commandsFolder}/global/${file}`);
        globalCommandData.push(module.data.toJSON());
        this.commands.set(module.data.name, module);
      }
      await rest.put(Routes.applicationCommands(process.env.CLIENT), { body: globalCommandData });
    }
  };

  scheduleTasks = () => {
    const tasksFolder = join(__dirname, './tasks');
    const taskFiles = readdirSync(`${tasksFolder}`);

    if (taskFiles.length) {
      for (const file of taskFiles) {
        require(`${tasksFolder}/${file}`);
      }
    }
  };

  /* --------------------- Bot Startup -------------------- */

  start = async () => {
    await mongo.connect();
    await this.scheduleTasks();
    await this.registerEventListeners();
    await this.deployCommands();
    await this.login(process.env.TOKEN);
  };
}

exports.client = new SBClient();
exports.client.start();
