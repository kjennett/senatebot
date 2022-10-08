const { mongo } = require('./database');
const client = require('./client');
const startPriorityBoard = require('./recruitment/priorityBoard');
const updateGameInfo = require('./api/updateGameInfo');

const { TOKEN } = process.env;

async function startup() {
  // ---------- Establish Database Connection ---------- //
  await mongo.connect();

  // ---------- Update Static Game Information ---------- //
  await updateGameInfo();

  // ---------- Register Event Handlers ---------- //
  await client.registerEventHandlers();

  // ---------- Deploy Application Commands ---------- //
  await client.deployApplicationCommands();

  // ---------- Connect Discord Client ---------- //
  await client.login(TOKEN);

  // ---------- Start Recruitment Priority Updater ---------- //
  await startPriorityBoard();
}

startup();
