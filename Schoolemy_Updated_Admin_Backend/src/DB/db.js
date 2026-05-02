import mongoose from 'mongoose';

// Cache the MongoDB connection for Lambda reuse
let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection if available (for Lambda warm starts)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // Get MONGO_URL at runtime (after dotenv has loaded)
  const MONGO_URL = process.env.MONGO_URL;
  
  if (!MONGO_URL) {
    throw new Error('MONGO_URL environment variable is not defined. Check your .env file.');
  }

  try {
    // Optimized options for serverless/Lambda environment
    const options = { 
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      maxPoolSize: 1, // Limit connection pool for Lambda
      minPoolSize: 0, // No minimum connections for serverless
      maxIdleTimeMS: 10000, // Close idle connections quickly
      retryWrites: true, // Retry failed writes
      w: 'majority' // Write concern
    };
    
    // Set mongoose buffering to false for serverless
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferTimeoutMS', 10000);
    
    await mongoose.connect(MONGO_URL, options);
    cachedConnection = mongoose.connection;

    // Drop the old unique index on `token` field in refreshtokens collection.
    // This index was present before the SHA-256 migration. New documents store
    // tokenHash (not token), so token is null — which violates the old unique index.
    try {
      await mongoose.connection.db.collection("refreshtokens").dropIndex("token_1");
      console.log("✓ Dropped legacy refreshtokens.token_1 index");
    } catch (e) {
      if (e.codeName !== "IndexNotFound") console.warn("Index drop skipped:", e.message);
    }

    return cachedConnection;
  } catch (error) {
    console.error(' MongoDB Connection Error:', error);
    // In Lambda, don't exit process, throw error instead
    if (process.env.NODE_ENV === 'lambda') {
      throw error;
    }
    process.exit(1);
  }
};

export default connectDB;