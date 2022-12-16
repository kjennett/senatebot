const { db } = require('../../database');

/**
 * Adds a new recruit thread entry to the database.
 * @param {number} ally_code The ally code of the new recruit's account
 * @param {*} discord_name The current name of the Discord user
 * @param {*} discord_user_id The ID of the Discord user
 * @param {*} tier The starting recruitment tier for the account.
 * @param {*} thread_id The ID of the created recruit thread
 * @param {*} thread_url The URL of the created recruit thread
 * @param {*} priority_message_id The ID of the priority list message
 */
exports.addRecruit = async (ally_code, discord_name, discord_user_id, tier, thread_id, thread_url, priority_message_id) => {
  await db.collection('recruits').insertOne({
    ally_code: ally_code,
    discord_name: discord_name,
    discord_user_id: discord_user_id,
    tier: tier,
    thread_id: thread_id,
    thread_url: thread_url,
    priority_message_id: priority_message_id,
  });
};
