const { connectToDatabase } = require('./database');
const { client } = require('./client');
const { updatePriorityBoard } = require('./functions/updatePriorityBoard');
const { updateGameData } = require('./functions/updateGameData');
const { updateGameEvents } = require('./functions/updateGameEvents');

async function startup() {
  console.clear();
  await connectToDatabase();
  await updateGameData();
  await client.start();
  await updatePriorityBoard();
  await updateGameEvents();
}

startup();
