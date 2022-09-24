const Jimp = require('jimp');
const { AttachmentBuilder } = require('discord.js');

/**
 * Creates and returns an AttachmentBuilder containing a customized welcome image for
 * new users joining the Discord server.
 */
module.exports = async name => {
  const font = await Jimp.loadFont('src/img/pathway.ttf.fnt');
  const background = await Jimp.read('src/img/welcometothesenate.png');
  const image = await background.print(font, 350 - Jimp.measureText(font, name) / 2, 150, name);
  const welcomeImage = await image.getBufferAsync(Jimp.MIME_PNG);

  return new AttachmentBuilder(welcomeImage);
};
