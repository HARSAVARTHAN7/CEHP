import '../src/config/env';
import mongoose from 'mongoose';
import { config } from '../src/config/env';

const COLLECTIONS = [
  'users',
  'studentprofiles',
  'facultyprofiles',
  'departments',
  'programs',
  'subjects',
  'semesters',
  'examinations',
  'resultrecords',
  'academicrules',
  'notifications',
  'auditlogs',
];

async function initCollections() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(config.mongodbUri);
  console.log('Connected successfully!');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed.');
  }

  const existing = await db.listCollections().toArray();
  const existingNames = new Set(existing.map((c) => c.name));

  console.log('\n--- Checking / Creating Database Collections ---');
  for (const name of COLLECTIONS) {
    if (existingNames.has(name)) {
      console.log(`✓ Collection already exists: ${name}`);
    } else {
      await db.createCollection(name);
      console.log(`+ Created new collection: ${name}`);
    }
  }

  console.log('\nAll 12 role and functional collections verified in Atlas!');
  await mongoose.disconnect();
  process.exit(0);
}

initCollections().catch((err) => {
  console.error('Failed to initialize collections:', err);
  process.exit(1);
});
