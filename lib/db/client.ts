// ─── MongoDB singleton client ─────────────────────────────────────────────
// Reuses the same MongoClient across hot reloads in dev, uses a fresh
// instance in production (one per serverless function invocation).

import { MongoClient } from 'mongodb';
import { DB_NAME } from './constants';

if (!process.env.MONGODB_URI) {
  throw new Error('Missing environment variable: MONGODB_URI');
}

const uri = process.env.MONGODB_URI;
const options = { appName: 'smashtour' };

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, options);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

export default client;

/** Convenience helper — returns the app database */
export function getDb() {
  return client.db(DB_NAME);
}
