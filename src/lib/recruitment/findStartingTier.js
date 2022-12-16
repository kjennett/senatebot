const { db } = require('../../database');

/**
 * Determines the starting recruitment tier of an account.
 * @param {number} gp The current Galactic Power of the account.
 * @returns {number} The number of the starting recruitment tier.
 */
exports.findStartingTier = async gp => {
  const result = await db.collection('tiers').findOne({
    maximum_gp: { $gte: gp },
    minimum_gp: { $lte: gp },
  });
  return result.number;
};
