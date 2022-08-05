const { MongoClient } = require('mongodb');

const mongo = new MongoClient(process.env.DB);
const db = mongo.db();

exports.connectToDatabase = async () => await mongo.connect();

exports.dbGuilds = db.collection('guilds');
exports.dbTiers = db.collection('tiers');
exports.dbAbilities = db.collection('abilities');
exports.dbCharacters = db.collection('characters');
exports.dbShips = db.collection('ships');
exports.dbDecisions = db.collection('decisions');
exports.dbRecruits = db.collection('recruits');
exports.dbPosts = db.collection('posts');
exports.dbThreads = db.collection('threads');
