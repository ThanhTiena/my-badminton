#!/usr/bin/env ts-node
// ─── Admin User Seeder ────────────────────────────────────────────────────
// Creates or updates an admin user in the database with a hashed password.
// Usage:
//   npx ts-node scripts/seed-admin.ts
//   or with custom credentials:
//   USERNAME=myadmin PASSWORD=mypass npx ts-node scripts/seed-admin.ts

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'smashtour';
const COLLECTION_NAME = 'users';

// Default credentials (override with environment variables)
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

async function seedAdmin() {
  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const username = process.env.USERNAME || DEFAULT_USERNAME;
  const password = process.env.PASSWORD || DEFAULT_PASSWORD;

  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI, { appName: 'smashtour-seeder' });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username });

    // Hash the password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    if (existingUser) {
      console.log(`⚠️  User "${username}" already exists. Updating password...`);

      await usersCollection.updateOne(
        { username },
        {
          $set: {
            passwordHash,
            updatedAt: new Date(),
          },
          $unset: { password: '' }, // Remove any legacy plain-text password
        }
      );

      console.log(`✅ Password updated for user "${username}"`);
    } else {
      console.log(`➕ Creating new admin user "${username}"...`);

      await usersCollection.insertOne({
        username,
        passwordHash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Admin user "${username}" created successfully`);
    }

    console.log('\n📋 Login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!\n');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
seedAdmin().catch(console.error);
