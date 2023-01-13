const axios = require('axios').default;
const { apiUrls } = require('../configs/apiUrls');

exports.fetchAllCharacters = async () => {
  try {
    const result = await axios.get(apiUrls.gg.characters);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

exports.fetchAllShips = async () => {
  try {
    const result = await axios.get(apiUrls.gg.ships);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

exports.fetchAllAbilities = async () => {
  try {
    const result = await axios.get(apiUrls.gg.abilities);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

exports.fetchAccount = async allyCode => {
  try {
    const result = await axios.get(`${apiUrls.gg.player}${allyCode}`);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

exports.fetchGuildProfile = async guildId => {
  try {
    const result = await axios.get(`${apiUrls.gg.guildProfile}${guildId}`);
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};

exports.fetchAllAccounts = async allyCodes => {
  try {
    const promises = allyCodes.map(allyCode => axios.get(`${apiUrls.gg.player}${allyCode}`));
    let results = await Promise.allSettled(promises);
    return results.filter(result => result.status === 'fulfilled').map(result => result.value.data);
  } catch (e) {
    return null;
  }
};
