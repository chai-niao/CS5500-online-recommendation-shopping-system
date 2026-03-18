const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hypermarket';
const client = new MongoClient(uri);

let db;

async function connectMongo() {
  await client.connect();
  db = client.db();
  console.log('MongoDB connected:', db.databaseName);
  return db;
}

function getDb() {
  if (!db) throw new Error('MongoDB not connected. Call connectMongo() first.');
  return db;
}

module.exports = { connectMongo, getDb, client };
