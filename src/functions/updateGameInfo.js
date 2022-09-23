const { db } = require('../database');
const axios = require('axios').default;

// Fetch character information from SWGOH.GG
const fetchCharacters = async () => {
  const response = await axios.get(`http://api.swgoh.gg/characters`);
  return response.data;
};

// Fetch ship information from SWGOH.GG
const fetchShips = async () => {
  const response = await axios.get(`http://api.swgoh.gg/ships`);
  return response.data;
};

// Fetch ability information from SWGOH.gg
const fetchAbilities = async () => {
  const response = await axios.get(`http://api.swgoh.gg/abilities`);
  return response.data;
};

/**
 * Hydrates the bot database with fresh ship, character, and ability information
 * from the SWGOH.GG API.
 */
module.exports = async () => {
  // Clear all pre-existing data from the database
  await db.collection('characters').deleteMany();
  await db.collection('ships').deleteMany();
  await db.collection('abilities').deleteMany();

  // Fetch fresh game information from the SWGOH.GG game API
  const [characters, ships, abilities] = await Promise.all([fetchCharacters(), fetchShips(), fetchAbilities()]);

  // Insert the newly fetched data into the database
  await db.collection('characters').insertMany(characters);
  await db.collection('ships').insertMany(ships);
  await db.collection('abilities').insertMany(abilities);
};
