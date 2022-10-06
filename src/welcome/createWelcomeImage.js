const Jimp = require('jimp');
const { AttachmentBuilder } = require('discord.js');

module.exports = async name => {
  // ---------- Load Font and Base Image ---------- //
  const font = await Jimp.loadFont('src/welcome/img/pathway.ttf.fnt');
  const background = await Jimp.read('src/welcome/img/welcometothesenate.png');

  // ---------- Print New Member Name ---------- //
  const image = await background.print(font, 350 - Jimp.measureText(font, name) / 2, 150, name);

  // ---------- Return Discord Attachment ---------- //
  const welcomeImage = await image.getBufferAsync(Jimp.MIME_PNG);
  return new AttachmentBuilder(welcomeImage);
};
