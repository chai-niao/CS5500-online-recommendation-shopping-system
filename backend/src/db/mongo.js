const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hypermarket';
const client = new MongoClient(uri);

let db;
let mongoConnected = false;

async function connectMongo() {
  await client.connect();
  db = client.db();
  mongoConnected = true;
  console.log('MongoDB connected:', db.databaseName);
  return db;
}

function getDb() {
  if (!db) throw new Error('MongoDB not connected. Call connectMongo() first.');
  return db;
}

function isMongoConnected() {
  return mongoConnected && !!db;
}

function tryGetDb() {
  return isMongoConnected() ? db : null;
}

module.exports = { connectMongo, getDb, tryGetDb, isMongoConnected, client };
