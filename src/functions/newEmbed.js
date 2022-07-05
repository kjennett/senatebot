const { MessageEmbed } = require('discord.js');

exports.newEmbed = () =>
  new MessageEmbed({
    color: 'RED',
    footer: {
      iconURL: process.env.SENATELOGO,
      text: 'ΞTHE SENATEΞ Alliance',
    },
  });
