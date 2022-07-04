const Jimp = require('jimp');
const { MessageAttachment } = require('discord.js');

exports.generateWelcomeImage = async name => {
  const [background, font] = await Promise.all([
    Jimp.read('src/img/welcometothesenate.png'),
    Jimp.loadFont('src/img/pathway.ttf.fnt'),
  ]);

  const image = background.print(font, 350 - Jimp.measureText(font, name) / 2, 150, name);
  const welcomeImage = await image.getBufferAsync(Jimp.MIME_PNG);
  return new MessageAttachment(welcomeImage, 'welcome.png');
};
