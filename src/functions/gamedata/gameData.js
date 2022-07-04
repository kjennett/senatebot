const axios = require('axios').default;

exports.fetchAbilities = async () => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/abilities`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    return null;
  }
};

exports.fetchCharacters = async () => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/characters`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    return null;
  }
};

exports.fetchShips = async () => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/ships`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    return null;
  }
};
