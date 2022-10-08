const axios = require('axios').default;

module.exports = async ally => {
  try {
    const response = await axios.get(`http://api.swgoh.gg/player/${ally}`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    return null;
  }
};
