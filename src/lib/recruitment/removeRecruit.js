const { db } = require('../../database');

// Removes a recruit thread database entry and all related decision entries from the database.
exports.removeRecruit = async ally => {
  await db.collection('recruits').deleteOne({ ally_code: ally });
  await db.collection('decisions').deleteMany({ ally_code: ally });
};
