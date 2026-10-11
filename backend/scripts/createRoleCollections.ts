import '../src/config/env';
import mongoose from 'mongoose';
import { config } from '../src/config/env';
import { User } from '../src/models/User';
import { StudentProfile } from '../src/models/StudentProfile';
import { FacultyProfile } from '../src/models/FacultyProfile';
import { Department } from '../src/models/Department';
import { Program } from '../src/models/Program';

async function createRoleCollections() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to Atlas successfully!');

  // Register referenced models
  if (!Department || !Program) throw new Error('Models missing');

  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  // Fetch all users with their populated profile data
  const users = await User.find({}).lean();
  const students = await StudentProfile.find({}).populate('userId departmentId programId').lean();
  const faculty = await FacultyProfile.find({}).populate('userId departmentId').lean();

  console.log(`Found ${users.length} total users in master 'users' collection.`);

  // Define separate role collections
  const roleCollections = {
    users_students: users.filter((u) => u.role === 'STUDENT').map((u) => {
      const profile = students.find((s) => String(s.userId?._id || s.userId) === String(u._id));
      return {
        ...u,
        studentDetails: profile || null,
        userCategory: 'STUDENT',
      };
    }),
    users_faculty: users.filter((u) => u.role === 'FACULTY').map((u) => {
      const profile = faculty.find((f) => String(f.userId?._id || f.userId) === String(u._id));
      return {
        ...u,
        facultyDetails: profile || null,
        userCategory: 'FACULTY',
      };
    }),
    users_hod: users.filter((u) => u.role === 'HOD').map((u) => ({
      ...u,
      userCategory: 'HEAD_OF_DEPARTMENT',
    })),
    users_exam_officers: users.filter((u) => u.role === 'EXAM_OFFICER').map((u) => ({
      ...u,
      userCategory: 'CONTROLLER_OF_EXAMINATIONS',
    })),
    users_admins: users.filter((u) => u.role === 'ADMIN').map((u) => ({
      ...u,
      userCategory: 'SYSTEM_ADMINISTRATOR',
    })),
  };

  console.log('\n--- Populating Role-Specific Collections in Atlas ---');

  for (const [collectionName, records] of Object.entries(roleCollections)) {
    const col = db.collection(collectionName);
    // Clear and insert
    await col.deleteMany({});
    if (records.length > 0) {
      await col.insertMany(records as any);
      console.log(`✓ Collection '${collectionName}' created with ${records.length} user records.`);
    } else {
      // Create empty collection if no records
      await db.createCollection(collectionName);
      console.log(`✓ Collection '${collectionName}' created (empty).`);
    }
  }

  console.log('\n✅ All separate role user collections successfully created in MongoDB Atlas!');
  await mongoose.disconnect();
  process.exit(0);
}

createRoleCollections().catch((err) => {
  console.error('Error creating role collections:', err);
  process.exit(1);
});
