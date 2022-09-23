const { MongoClient } = require('mongodb');

const mongo = new MongoClient(process.env.DB);
exports.db = mongo.db();
exports.mongo = mongo;
