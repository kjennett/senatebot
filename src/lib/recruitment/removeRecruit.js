const { db } = require('../../database');

/**
 * Remove a recruit thread and all related entries from the database.
 * @param {number} ally The ally code of the recruit to remove
 * @param {string} reason The reason the recruit is being removed from the system
 * @returns {boolean} True if successful, false if any error
 */
exports.removeRecruit = async (ally, reason) => {
  // Find the recruit thread entry, if one exists
  const recruitThread = await db.collection('recruits').findOne({ ally_code: ally });
  if (!recruitThread) return false;

  // Delete any existing decision entries for the ally code
  await db.collection('decisions').deleteMany({ ally_code: ally });

  // Add the recruit's information to the "past recruits" collection
  await db.collection('pastrecruits').insertOne({
    discord_user_id: recruitThread.discord_user_id,
    ally_code: recruitThread.ally_code,
    thread_url: recruitThread.thread_url,
    outcome: reason,
    close_time: Date.now(),
  });

  await db.collection('recruits').deleteOne({ ally_code: ally });
};
