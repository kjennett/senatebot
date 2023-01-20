const { ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder } = require('discord.js');
const Jimp = require('jimp');

exports.welcomeMenu = new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder()
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

exports.welcomeImage = async name => {
  const [font, bg] = await Promise.all([
    Jimp.loadFont('src/lib/welcome/img/pathway.ttf.fnt'),
    Jimp.read('src/lib/welcome/img/welcometothesenate.png'),
  ]);
  const image = await bg.print(font, 350 - Jimp.measureText(font, name) / 2, 150, name);
  const welcomeImage = await image.getBufferAsync(Jimp.MIME_PNG);
  return new AttachmentBuilder(welcomeImage);
};
