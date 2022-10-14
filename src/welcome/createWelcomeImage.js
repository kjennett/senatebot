const Jimp = require('jimp');
const { AttachmentBuilder } = require('discord.js');

module.exports = async name => {
  const font = await Jimp.loadFont('src/welcome/img/pathway.ttf.fnt');
  const bg = await Jimp.read('src/welcome/img/welcometothesenate.png');
  const image = await bg.print(font, 350 - Jimp.measureText(font, name) / 2, 150, name);
  const welcomeImage = await image.getBufferAsync(Jimp.MIME_PNG);
  return new AttachmentBuilder(welcomeImage);
};
