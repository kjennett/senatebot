const { MessageEmbed } = require('discord.js');
const { client } = require('../client');

module.exports = {
  name: 'ready',

  async execute() {
    await client.guilds.fetch();

    const embed = new MessageEmbed({
      title: 'Startup Complete!',
      description: `Servers: ${client.guilds.cache.size}\nCommands: ${client.commands.size}`,
      color: 'GREEN',
    }).setTimestamp();

    const owner = await client.users.fetch(process.env.OWNER);
    await owner.send({ embeds: [embed] });

    console.info('Startup complete!');
  },
};
