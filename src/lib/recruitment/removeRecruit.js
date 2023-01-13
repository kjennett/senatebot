const { db } = require('../../database');

/**
 * @param {number} ally The ally code of the recruit to remove
 * @param {string} reason The reason the recruit is being removed from the system
 * @returns {boolean} True if successful, false if any error
 */
exports.removeRecruit = async (ally, reason) => {
  const recruitThread = await db.collection('recruits').findOne({ ally_code: ally });
  if (!recruitThread) return false;

  await db.collection('decisions').deleteMany({ ally_code: ally });

  await db.collection('pastrecruits').insertOne({
    discord_user_id: recruitThread.discord_user_id,
    ally_code: recruitThread.ally_code,
    thread_url: recruitThread.thread_url,
    outcome: reason,
    close_time: Date.now(),
  });

  await db.collection('recruits').deleteOne({ ally_code: ally });
};
