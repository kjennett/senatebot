const { connectToDatabase } = require('./database');
const { client } = require('./client');
const { updatePriorityBoard } = require('./functions/updatePriorityBoard');
const { updateGameData } = require('./functions/updateGameData');
const { updateGameEvents } = require('./functions/updateGameEvents');

const { TOKEN } = process.env;

async function startup() {
  console.clear();
  console.info('------ SENATEBOT STARTING -------');
  await connectToDatabase();
  await updateGameData();
  await Promise.all([client.registerEventHandlers(), client.deployApplicationCommands()]);
  await client.login(TOKEN);
  await Promise.all([updatePriorityBoard(), updateGameEvents()]);
  console.info('------ SENATEBOT ONLINE ------');
}

startup();
