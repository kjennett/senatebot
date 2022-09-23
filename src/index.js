const { mongo } = require('./database');
const { client } = require('./client');
const { updatePriorityBoard } = require('./functions/updatePriorityBoard');
const { updateGameData } = require('./functions/updateGameData');

const { TOKEN } = process.env;

async function startup() {
  await mongo.connect();
  await updateGameData();
  await client.registerEventHandlers();
  await client.deployApplicationCommands();

  await client.login(TOKEN);
  await updatePriorityBoard();
}

startup();
