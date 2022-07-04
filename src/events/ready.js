const { log } = require('../log');

module.exports = {
  name: 'ready',
  once: true,

  async execute() {
    log.info('Startup complete!');
  },
};
