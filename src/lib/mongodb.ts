import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifex-reddit-monitor';
const dbName = process.env.MONGODB_DB_NAME || 'lifex-reddit-monitor';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    
    console.log('✅ Connected to MongoDB Atlas');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

export async function closeConnection() {
  if (client) {
    await client.close();
  }
}

// Global connection for Next.js API routes
let globalClient: MongoClient;
let globalDb: Db;

export async function getGlobalDatabase() {
  if (globalDb) {
    return globalDb;
  }

  try {
    globalClient = new MongoClient(uri);
    await globalClient.connect();
    globalDb = globalClient.db(dbName);
    return globalDb;
  } catch (error) {
    console.error('❌ Global MongoDB connection failed:', error);
    throw error;
  }
}
