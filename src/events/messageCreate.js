module.exports = {
  name: 'threadUpdate',

  async execute(message) {
    if (message.content.toLowerCase().includes('circle')) {
      await message.react('👀');
    }
  },
};
