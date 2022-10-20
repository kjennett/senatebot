const { EmbedBuilder } = require('discord.js');
const client = require('../client');

module.exports = {
  name: 'ready',

  async execute() {
    await client.guilds.fetch();
    const owner = await client.users.fetch(process.env.OWNER);

    await owner.send({
      embeds: [
        new EmbedBuilder({
          title: 'Startup Complete!',
          description: `Servers: ${client.guilds.cache.size}\nCommands: ${client.commands.size}`,
        }).setTimestamp(),
      ],
    });
  },
};
