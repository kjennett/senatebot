const { SlashCommandBuilder } = require('discord.js');

// --------------------
// Circle GIFs
// --------------------

const circleGIFs = [
  'https://tenor.com/view/circle-marriage-love-like-a-circle-never-ends-gif-12894046',
  'https://tenor.com/view/im-a-circle-circle-smile-happy-gif-16681322',
  'https://tenor.com/view/circle-gif-21349221',
  'https://tenor.com/view/circle-pattern-shuffle-gif-16808864',
  'https://tenor.com/view/i-keep-my-circle-tight-real-housewives-of-new-york-i-keep-my-friends-close-i-choose-my-friends-well-its-for-my-friends-only-gif-20815481',
  'https://tenor.com/view/it-was-a-full-circle-moment-conceited-yo-mtv-raps-s1e2-it-came-together-gif-25832095',
  'https://tenor.com/view/crazy-train-meme-gif-25706732',
  'https://tenor.com/view/circle-gif-18184138',
  'https://tenor.com/view/taiga-circle-flaming-neon-light-gif-15738162',
  'https://tenor.com/view/the-circle-of-life-gif-9789392',
  'https://tenor.com/view/star-wars-circle-is-now-complete-ready-to-fight-gif-13935226',
  'https://tenor.com/view/signs-infinity-spin-circle-gif-16004697',
  'https://tenor.com/view/donald-trump-potus-president-georgia-dalton-gif-19834205',
  'https://tenor.com/view/join-a-circle-womens-march-join-hands-circle-come-together-gif-20882813',
  'https://tenor.com/view/circle-gif-18023149',
  'https://tenor.com/view/full-circle-olanrogers-youtube-gif-4749604',
  'https://tenor.com/view/circle-rolling-roll-digital-art-circle-digital-art-gif-15098198',
  'https://cdn.discordapp.com/attachments/543616183237345280/1046791669149872149/tenor.gif',
  'https://tenor.com/view/neil-primrose-travis-band-music-motorbike-gif-22542797',
  'https://tenor.com/view/gift-colors-circles-gif-12745720',
];

// --------------------
// PRAISE THE CIRCLE Role
// --------------------

const circleRole = '1046627394146021448';

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder()
    .setName('praisethecircle')
    .setDescription('CIRCLE IS LIFE. CIRCLE IS LOVE. CIRCLE IS FOREVER.'),

  async execute(i) {
    // --------------------
    // Add PRAISE THE CIRCLE Role
    // --------------------

    await i.member.roles.add(await i.member.guild.roles.fetch(circleRole));

    // --------------------
    // Random Circle GIF Response
    // --------------------

    await i.reply(circleGIFs[Math.floor(Math.random() * circleGIFs.length)]);
  },
};