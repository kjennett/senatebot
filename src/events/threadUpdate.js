const { db } = require('../database');

module.exports = {
  name: 'threadUpdate',

  async execute(oldThread, newThread) {
    // If the thread has been newly archived for any reason, check for keep-alive registration
    if (!oldThread.archived && newThread.archived) {
      const dbThread = await db.collection('threads').findOne({ id: oldThread.id });
      if (!dbThread) return;

      // Join thread if able (SenateBot should already be joined to all threads from keepalive command)
      if (!newThread.joined && newThread.joinable) await newThread.join();
      if (!newThread.joined && !newThread.joinable) {
        return;
      }

      // Unarchive the thread
      if (newThread.joined) {
        await newThread.setArchived(false, 'SenateBot keep-alive');
      }
    }
  },
};
