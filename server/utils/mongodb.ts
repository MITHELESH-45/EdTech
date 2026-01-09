/**
 * MongoDB Connection Utility
 * 
 * Handles MongoDB connection using the official MongoDB driver
 * Uses ServerApiVersion for stable API compatibility
 */

import { MongoClient, Db, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// Use the same connection string as auth routes - ensure it's always set
const DEFAULT_MONGODB_URI = "mongodb+srv://tridev:Edtech12@info-edtech.05d39mj.mongodb.net/?appName=info-edtech&retryWrites=true&w=majority";
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
const DB_NAME = "users";
const COLLECTION_NAME = "login";

// Validate connection string
if (!MONGODB_URI || (!MONGODB_URI.startsWith("mongodb://") && !MONGODB_URI.startsWith("mongodb+srv://"))) {
  console.error("[MongoDB] Invalid connection string. Must start with 'mongodb://' or 'mongodb+srv://'");
  console.error("[MongoDB] Connection string value:", MONGODB_URI);
  throw new Error("MongoDB connection string is invalid or missing");
}

// Log connection string status (masked for security)
console.log(`[MongoDB] Connection string configured: ${MONGODB_URI.replace(/:[^:@]+@/, ":****@")}`);

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB with ServerApiVersion and retry logic
 */
export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    if (!client) {
      // Get connection string (use constant or fallback)
      const connectionString = MONGODB_URI || DEFAULT_MONGODB_URI;
      
      // Validate connection string before creating client
      if (!connectionString || (!connectionString.startsWith("mongodb://") && !connectionString.startsWith("mongodb+srv://"))) {
        console.error("[MongoDB] Invalid connection string at runtime:", connectionString);
        throw new Error("MongoDB connection string is invalid");
      }
      
      // Create a MongoClient with a MongoClientOptions object to set the Stable API version
      client = new MongoClient(connectionString, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        connectTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
      });

      // Connect the client to the server
      await client.connect();
      
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("[MongoDB] Pinged your deployment. You successfully connected to MongoDB!");
    }

    db = client.db(DB_NAME);
    
    // Ensure the login collection exists
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      await db.createCollection(COLLECTION_NAME);
      console.log(`[MongoDB] Created collection: ${COLLECTION_NAME}`);
    }
    
    console.log(`[MongoDB] Using database: ${DB_NAME}, collection: ${COLLECTION_NAME}`);
    return db;
  } catch (error: any) {
    console.error("[MongoDB] Connection error:", error);
    const connectionString = MONGODB_URI || DEFAULT_MONGODB_URI;
    const maskedUri = connectionString ? connectionString.replace(/:[^:@]+@/, ":****@") : "UNDEFINED";
    console.error("[MongoDB] Connection string:", maskedUri);
    console.error("[MongoDB] Connection string length:", connectionString?.length || 0);
    
    // Reset client on error
    client = null;
    db = null;
    
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
}

/**
 * Get the database instance
 */
export async function getDatabase(): Promise<Db> {
  if (!db) {
    return await connectToMongoDB();
  }
  return db;
}

/**
 * Get the login collection
 * Ensures we're using the correct collection name: "login"
 */
export async function getLoginCollection() {
  const database = await getDatabase();
  const collection = database.collection(COLLECTION_NAME);
  
  // Verify collection exists
  const collections = await database.listCollections({ name: COLLECTION_NAME }).toArray();
  if (collections.length === 0) {
    console.warn(`[MongoDB] Warning: Collection "${COLLECTION_NAME}" does not exist. It will be created on first insert.`);
  }
  
  return collection;
}

/**
 * Close MongoDB connection
 */
export async function closeMongoDBConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("[MongoDB] Connection closed");
  }
}

