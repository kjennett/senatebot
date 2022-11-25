const { MongoClient } = require('mongodb');

const mongo = new MongoClient(process.env.DB);
const db = mongo.db();
exports.mongo = mongo;
exports.db = db;
