const { connectToDatabase } = require('./database');
const { cache } = require('./cache');
const { client } = require('./client');

const validateEnvironment = () => {
  const reqVar = ['TOKEN', 'CLIENT', 'SERVER', 'DB', 'SENATELOGO'];
  const allDefined = reqVar.every(rVar => {
    process.env[rVar] ? true : false;
  });
  if (!allDefined) throw new Error('One or more required environment variables not found.');
};

async function startup() {
  await validateEnvironment();
  await connectToDatabase();
  await cache.update();
  await cache.startUpdater();
  await client.start();
}

startup();
