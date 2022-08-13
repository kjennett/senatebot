const { MongoClient } = require('mongodb');

// MongoDB Client
const mongo = new MongoClient(process.env.DB);

// Default collection accessor (based on URI, determined by environment)
const db = mongo.db();

// Establish connection to MongoDB
exports.connectToDatabase = async () => await mongo.connect();

// Collection accessors for all active collections
exports.dbGuilds = db.collection('guilds');
exports.dbTiers = db.collection('tiers');
exports.dbAbilities = db.collection('abilities');
exports.dbCharacters = db.collection('characters');
exports.dbShips = db.collection('ships');
exports.dbDecisions = db.collection('decisions');
exports.dbRecruits = db.collection('recruits');
exports.dbPosts = db.collection('posts');
exports.dbThreads = db.collection('threads');
