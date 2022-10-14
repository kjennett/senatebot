const { MongoClient } = require('mongodb');

const mongo = new MongoClient(process.env.DB);
exports.mongo = mongo;
exports.db = mongo.db();
