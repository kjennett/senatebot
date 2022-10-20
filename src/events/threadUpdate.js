const { db } = require('../database');

module.exports = {
  name: 'threadUpdate',

  async execute(oldThread, newThread) {
    if (!oldThread.archived && newThread.archived) {
      const dbThread = await db.collection('threads').findOne({ id: oldThread.id });
      if (!dbThread) return;

      if (!newThread.joined && newThread.joinable) await newThread.join();
      if (!newThread.joined && !newThread.joinable) {
        return;
      }

      if (newThread.joined) {
        await newThread.setArchived(false, 'SenateBot keep-alive');
      }
    }
  },
};
