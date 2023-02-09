const axios = require('axios').default;
const { apiUrls } = require('../configs/apiUrls');

exports.fetchPlayerComlink = async allycode => {
  try {
    const result = await axios.post(`${apiUrls.comlink.player}${allycode}`, {
      payload: { allyCode: `${allycode}` },
      enums: false,
    });
    if (!result.status === 200) return null;
    return result.data;
  } catch (e) {
    return null;
  }
};
