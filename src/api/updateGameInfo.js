const { db } = require('../database');
const axios = require('axios').default;

const fetchCharacters = async () => {
  const response = await axios.get(`http://api.swgoh.gg/characters`);
  return response.data;
};

const fetchShips = async () => {
  const response = await axios.get(`http://api.swgoh.gg/ships`);
  return response.data;
};

const fetchAbilities = async () => {
  const response = await axios.get(`http://api.swgoh.gg/abilities`);
  return response.data;
};

module.exports = async () => {
  await db.collection('characters').deleteMany();
  await db.collection('ships').deleteMany();
  await db.collection('abilities').deleteMany();

  const [characters, ships, abilities] = await Promise.all([fetchCharacters(), fetchShips(), fetchAbilities()]);

  await db.collection('characters').insertMany(characters);
  await db.collection('ships').insertMany(ships);
  await db.collection('abilities').insertMany(abilities);
};
