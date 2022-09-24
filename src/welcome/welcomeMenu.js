const { ActionRowBuilder, SelectMenuBuilder } = require('discord.js');

module.exports = new ActionRowBuilder().addComponents(
  new SelectMenuBuilder()
    .setCustomId('welcomeMenu')
    .setPlaceholder("I'm here to...")
    .addOptions([
      { label: 'Look for a guild to join.', value: 'newguild' },
      { label: 'Talk about bringing a guild into the alliance.', value: 'merger' },
      { label: 'Find someone from my arena shard.', value: 'shard' },
      { label: 'Learn about OmegaBot', value: 'omegabot' },
      { label: 'Other', value: 'other' },
      { label: 'Leave immediately without saying anything', value: 'kick' },
    ])
);
