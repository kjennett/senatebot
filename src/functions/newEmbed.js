const { MessageEmbed } = require('discord.js');

exports.newEmbed = () =>
  new MessageEmbed({
    color: 'RED',
    thumbnail: {
      url: process.env.SENATELOGO,
    },
  });
