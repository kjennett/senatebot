const { MongoClient } = require('mongodb');

/** Default database connection */
exports.mongo = new MongoClient(process.env.DB);

/** Default collection accessor (based on connection URL) */
exports.db = exports.mongo.db();
