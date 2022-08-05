const { dbCharacters, dbShips, dbAbilities } = require('../database');
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

exports.updateGameData = async () => {
  await dbCharacters.deleteMany();
  await dbShips.deleteMany();
  await dbAbilities.deleteMany();

  const [characters, ships, abilities] = await Promise.all([fetchCharacters(), fetchShips(), fetchAbilities()]);

  await dbCharacters.insertMany(characters);
  await dbShips.insertMany(ships);
  await dbAbilities.insertMany(abilities);
};
