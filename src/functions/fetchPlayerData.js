const axios = require('axios').default;
const rateLimit = require('axios-rate-limit');

exports.fetchGG = async allycode => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/player/${allycode}`);
    if (response.status !== 200) return false;
    return true;
  } catch (e) {
    return false;
  }
};

exports.fetchGG = async allycode => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/player/${allycode}`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    return null;
  }
};

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

// Globally limits queries to the SWGOH.HELP premium client (currently 2 requests / second)
const limited = rateLimit(axios.create(), { maxRPS: 2 });

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
