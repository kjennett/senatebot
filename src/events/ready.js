const { log } = require('../log');
const { newEmbed } = require('../functions/newEmbed');
const { client } = require('../client');

module.exports = {
  name: 'ready',
  once: true,

  async execute() {
    await client.guilds.fetch();
    const embed = newEmbed()
      .setTitle('Startup Complete')
      .setDescription(`Servers: ${client.guilds.cache.size} | Commands: ${client.commands.size}`)
      .setTimestamp();
    const owner = await client.users.fetch(process.env.OWNER);
    await owner.send({ embeds: [embed] });
    log.info('Startup complete!');
  },
};
