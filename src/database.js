const { MongoClient } = require('mongodb');

// ---------- MongoDB Client ---------- //
const mongo = new MongoClient(process.env.DB);
exports.mongo = mongo;

// ---------- Default DB Accessor ---------- //
exports.db = mongo.db();
