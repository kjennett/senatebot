const axios = require('axios').default;
const { apiUrls } = require('../configs/apiUrls');

/** Fetch an array of character data objects from SWGOH.GG */
exports.fetchAllCharacters = async () => {
  try {
    const result = await axios.get(apiUrls.gg.characters);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

/** Fetch an array of ship data objects from SWGOH.GG */
exports.fetchAllShips = async () => {
  try {
    const result = await axios.get(apiUrls.gg.ships);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

/** Fetch an array of ability data objects from SWGOH.GG  */
exports.fetchAllAbilities = async () => {
  try {
    const result = await axios.get(apiUrls.gg.abilities);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

/** Fetch an account data object from SWGOH.GG */
exports.fetchAccount = async allyCode => {
  try {
    const result = await axios.get(`${apiUrls.gg.player}${allyCode}`);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

/** Fetch a guild profile data object from SWGOH.GG */
exports.fetchGuildProfile = async guildId => {
  try {
    const result = await axios.get(`${apiUrls.gg.guildProfile}${guildId}`);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};
