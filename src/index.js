const { connectToDatabase } = require('./database');
const { client } = require('./client');
const { updatePriorityBoard } = require('./functions/updatePriorityBoard');
const { updateGameData } = require('./functions/updateGameData');
const { updateGameEvents } = require('./functions/updateGameEvents');

const validateEnvironment = () => {
  const reqVar = ['TOKEN', 'CLIENT', 'SERVER', 'DB', 'SENATELOGO'];
  const allDefined = reqVar.every(rVar => {
    return process.env[rVar] ? true : false;
  });
  if (!allDefined) throw new Error('One or more required environment variables not found.');
};

async function startup() {
  await validateEnvironment();
  await connectToDatabase();
  await updateGameData();
  await client.start();
  await updatePriorityBoard();
  await updateGameEvents();
}

startup();
