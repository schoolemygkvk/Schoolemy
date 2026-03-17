import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { MONGO_URL } = process.env;

// Cache the MongoDB connection for Lambda reuse
let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection if available (for Lambda warm starts)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️  Using cached MongoDB connection');
    return cachedConnection;
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
    console.log('✅ MongoDB Connected (UTF-8 encoding enabled)');
    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    // In Lambda, don't exit process, throw error instead
    if (process.env.NODE_ENV === 'lambda') {
      throw error;
    }
    process.exit(1);
  }
};

export default connectDB;