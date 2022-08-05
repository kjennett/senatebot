const { dbThreads } = require('../database');

module.exports = {
  name: 'threadUpdate',

  async execute(oldThread, newThread) {
    if (!oldThread.archived && newThread.archived) {
      const dbThread = await dbThreads.findOne({ id: oldThread.id });
      if (!dbThread) return;

      if (!newThread.joined && newThread.joinable) await newThread.join();
      if (!newThread.joined && !newThread.joinable) {
        console.error(`Unable to join thread with id ${newThread.id} (SenateBot keep-alive)`);
        return;
      }
      if (newThread.joined) {
        await newThread.setArchived(false, 'SenateBot keep-alive');
        console.log(`Un-archived thread with id ${newThread.id} (SenateBot keep-alive)`);
      }
    }
  },
};
