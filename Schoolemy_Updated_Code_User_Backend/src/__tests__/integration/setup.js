

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { beforeAll, afterAll, afterEach } from "@jest/globals";

let mongod = null;


export const setupDatabase = async () => {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
};


export const teardownDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongod) {
    await mongod.stop();
  }
};


export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};


export const createTestToken = (payload, secret = process.env.JWT_SECRET || "test-secret-key") => {
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Set process.env.JWT_SECRET");
  }
  return jwt.sign(payload, secret, { expiresIn: "24h" });
};


export const getAuthHeader = (token) => {
  return { authorization: `Bearer ${token}` };
};


export const resetTimers = () => {
  jest.clearAllTimers();
};


beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-testing";
  await setupDatabase();
}, 30000); // Increase timeout for mongodb-memory-server startup


afterAll(async () => {
  await teardownDatabase();
}, 30000); // Increase timeout for mongodb cleanup


afterEach(async () => {
  await clearDatabase();
});
