const { mongo } = require('./database');
const client = require('./client');
const startPriorityBoard = require('./recruitment/priorityBoard');
const updateGameInfo = require('./api/updateGameInfo');
const updateEvents = require('./api/updateEvents');

const { TOKEN } = process.env;

async function startup() {
  await mongo.connect();
  await updateGameInfo();
  await client.registerEvents();
  await client.deployCommands();
  await client.login(TOKEN);
  await startPriorityBoard();
  await updateEvents();
}

startup();
