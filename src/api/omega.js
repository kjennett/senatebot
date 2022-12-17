const axios = require('axios').default;
const { apiUrls } = require('../configs/apiUrls');

exports.fetchOmega = async ally => {
  try {
    const response = await axios.get(`${apiUrls.omega}${ally}`);
    if (response.status !== 200) return null;
    return response.data;
  } catch (e) {
    return null;
  }
};
