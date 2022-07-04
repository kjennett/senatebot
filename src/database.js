const { MongoClient } = require('mongodb');

const mongo = new MongoClient(process.env.DB);

exports.connectToDatabase = async () => await mongo.connect();
exports.db = mongo.db();
