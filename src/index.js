const { mongo } = require('./database');
const client = require('./client');
const startPriorityBoard = require('./functions/priorityBoard');
const updateGameInfo = require('./functions/updateGameInfo');

const { TOKEN } = process.env;

async function startup() {
  await mongo.connect();

  await updateGameInfo();

  await client.registerEventHandlers();
  await client.deployApplicationCommands();

  await client.login(TOKEN);

  await startPriorityBoard();
}

startup();
