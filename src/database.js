const { MongoClient } = require('mongodb');

/* ------------------- Database Client ------------------ */

exports.mongo = new MongoClient(process.env.DB);
exports.db = exports.mongo.db();
