const { db } = require('../../database');

exports.findStartingTier = async gp => {
  const result = await db.collection('tiers').findOne({
    maximum_gp: { $gte: gp },
    minimum_gp: { $lte: gp },
  });
  return result.number;
};
