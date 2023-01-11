const { MongoClient } = require('mongodb');

exports.mongo = new MongoClient(process.env.DB);
exports.db = exports.mongo.db();
