const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/hypermarket';
const mongoOptions = {
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || '15000', 10),
  // Render + Atlas sometimes behaves better with IPv4-first resolution
  family: 4,
};

// Emergency switch for demo troubleshooting only (do not keep enabled long-term)
if (process.env.MONGO_TLS_INSECURE === 'true') {
  mongoOptions.tls = true;
  mongoOptions.tlsAllowInvalidCertificates = true;
  mongoOptions.tlsAllowInvalidHostnames = true;
}

const client = new MongoClient(uri, mongoOptions);

let db;
let mongoConnected = false;

async function connectMongo() {
  await client.connect();
  db = process.env.MONGO_DB_NAME ? client.db(process.env.MONGO_DB_NAME) : client.db();
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
