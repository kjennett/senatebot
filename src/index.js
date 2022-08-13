const { connectToDatabase } = require('./database');
const { client } = require('./client');
const { updatePriorityBoard } = require('./functions/updatePriorityBoard');
const { updateGameData } = require('./functions/updateGameData');
const { bumpInactiveThreads } = require('./functions/bumpInactiveThreads');

const { TOKEN } = process.env;

async function startup() {
  // Establish connection to MongoDB
  await connectToDatabase();

  // Pull game information from SWGOH.GG, update database
  await updateGameData();

  // Register Discord client event handlers and deploy application commands
  await client.registerEventHandlers();
  await client.deployApplicationCommands();

  // Connect to Discord gateway
  await client.login(TOKEN);

  // Update recruitment tier priority list
  await updatePriorityBoard();

  // Begin checking recruitment threads and bump if needed
  await bumpInactiveThreads();
}

startup();
