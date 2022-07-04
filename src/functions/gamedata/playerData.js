const axios = require('axios').default;
const rateLimit = require('axios-rate-limit');

/**
 * Validates whether an ally code is registered to the SWGOH.GG API.
 */
exports.fetchGG = async allycode => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/player/${allycode}`);
    if (response.status !== 200) return false;
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Fetches player data from the SWGOH.GG API.
 * Null response indicates fetch error, invalid input, or invalid response.
 */
exports.fetchGG = async allycode => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/player/${allycode}`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    return null;
  }
};

/**
 * Fetches a guild's data from the SWGOH.GG API.
 * Null response indicates fetch error, invalid input, or invalid response.
 */
exports.fetchGgGuild = async guildId => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/guild-profile/${guildId}`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Fetches player data from the Omega API.
 * Null response indicates fetch error, invalid input, or invalid response.
 */
exports.fetchOmega = async allycode => {
  try {
    const response = await axios.get(`${process.env.OMEGA}${allycode}`);
    if (response.status === 500) return null;
    return response.data;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/** Globally limits queries to the SWGOH.HELP premium client (currently 2 requests / second) */
const limited = rateLimit(axios.create(), { maxRPS: 2 });

/**
 * Fetches player data from the Omega API.
 * Null response indicates fetch error, invalid input, or invalid response.
 */
exports.fetchHelp = async allycode => {
  try {
    const response = await limited.get(`${process.env.SWGOHHELP}player/${allycode}`);
    if (response.data.error) return null;
    return response.data;
  } catch (e) {
    console.error(e);
    return null;
  }
};
