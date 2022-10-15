const axios = require('axios').default;

module.exports = async id => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/guild-profile/${id}`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    return null;
  }
};
