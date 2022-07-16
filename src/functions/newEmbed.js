const { MessageEmbed } = require('discord.js');

exports.newEmbed = () =>
  new MessageEmbed({
    color: 'RED',
    footer: {
      icon_url: process.env.SENATELOGO,
      text: 'THE SENATE Alliance',
    },
  });
