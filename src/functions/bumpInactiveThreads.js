const { dbRecruits, dbTiers } = require('../database');
const { client } = require('../client');

// The amount of time a thread may be inactive before it is bumped (milliseconds)
const bumpTimer = 8.64e7; // ONE DAY

async function bumpThreads() {
  // Fetch database records for all registered recruitment threads
  const dbRec = await dbRecruits.find().toArray();

  // Compute the cutoff datetime for bumping threads
  const bumpDate = Date.now() - bumpTimer;

  for (const recruit of dbRec) {
    // Fetch the Discord thread channel and the last message in that channel
    const t = await client.channels.fetch(recruit.thread_id);
    const last = await t.messages.fetch(t.lastMessageId);

    // Verify that the last message sent in the thread was before the bump timer
    if (last.createdTimestamp >= bumpDate) continue;

    // Fetch the recruitment tier of the thread, and the recruiter role for that tier
    const dbTier = await dbTiers.findOne({ number: recruit.tier });
    const rRole = await t.guild.roles.fetch(dbTier.recruiter_role_id);

    // Send the bump message to the thread
    await t.send(
      `${rRole} : The last message sent in this thread was more than 24 hours ago. Please remember to use the \`/recruit claim\` or \`/recruit close\` commands if the recruitment process for this user is complete.`
    );
  }
}

exports.bumpInactiveThreads = async () => {
  return;
  // console.log('Checking recruitment threads for bumping...');
  // await bumpThreads();
  // setInterval(() => {
  //   bumpThreads();
  // }, 300000);
};
