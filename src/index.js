const { mongo } = require('./database');
const client = require('./client');
const startPriorityBoard = require('./recruitment/priorityBoard');
const updateGameInfo = require('./api/updateGameInfo');
const updateEvents = require('./api/updateEvents');

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

  // ---------- Start Recruitment Priority and Events Updaters ---------- //
  await startPriorityBoard();
  await updateEvents();
}

startup();
