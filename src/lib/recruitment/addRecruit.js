const { db } = require('../../database');

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
