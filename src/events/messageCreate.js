module.exports = {
  name: 'messageCreate',

  async execute(message) {
    if (message.content.toLowerCase().includes('circle')) {
      await message.react('👀');
    }
  },
};
