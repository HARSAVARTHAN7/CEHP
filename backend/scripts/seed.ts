/**
 * DEVELOPMENT SEED SCRIPT
 * Creates realistic fictional data for development and testing.
 * DO NOT run in production.
 */
import '../src/config/env'; // Load env first
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/env';
import { User } from '../src/models/User';
import { StudentProfile } from '../src/models/StudentProfile';
import { FacultyProfile } from '../src/models/FacultyProfile';
import { Department } from '../src/models/Department';
import { Program } from '../src/models/Program';
import { Subject } from '../src/models/Subject';
import { Semester } from '../src/models/Semester';
import { Examination } from '../src/models/Examination';
import { ResultRecord } from '../src/models/ResultRecord';
import { AcademicRule } from '../src/models/AcademicRule';
import { Notification } from '../src/models/Notification';
import { logger } from '../src/utils/logger';
import {
  calculateGrade,
  determineResultStatus,
  getDefaultGradeThresholds,
} from '../src/services/academicCalculation';

async function seed() {
  if (config.nodeEnv === 'production') {
    throw new Error('❌ Seed script cannot run in production!');
  }

  await mongoose.connect(config.mongodbUri);
  logger.info('Connected to MongoDB for seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    StudentProfile.deleteMany({}),
    FacultyProfile.deleteMany({}),
    Department.deleteMany({}),
    Program.deleteMany({}),
    Subject.deleteMany({}),
    Semester.deleteMany({}),
    Examination.deleteMany({}),
    ResultRecord.deleteMany({}),
    AcademicRule.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  logger.info('Cleared existing data.');

  const passwordHash = await bcrypt.hash('Demo@1234', config.bcryptRounds);

  // ---- DEPARTMENTS ----
  const csDept = await Department.create({ name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' });
  const eceDept = await Department.create({ name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of ECE' });
  const mechDept = await Department.create({ name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' });
  logger.info('Departments created.');

  // ---- PROGRAMS ----
  const beTech = await Program.create({
    name: 'Bachelor of Engineering - Computer Science',
    code: 'BE-CSE',
    departmentId: csDept._id,
    duration: 4,
    totalSemesters: 8,
    creditSystem: 'CGPA',
    degree: 'B.E.',
  });
  const beTechECE = await Program.create({
    name: 'Bachelor of Engineering - ECE',
    code: 'BE-ECE',
    departmentId: eceDept._id,
    duration: 4,
    totalSemesters: 8,
    creditSystem: 'CGPA',
    degree: 'B.E.',
  });
  logger.info('Programs created.');

  // ---- ACADEMIC RULES ----
  const thresholds = getDefaultGradeThresholds();
  await AcademicRule.create({
    programId: beTech._id,
    effectiveFrom: '2022-2023',
    minPassPercentage: 50,
    minInternalPassMarks: 20,
    minExternalPassMarks: 30,
    gradeThresholds: thresholds,
    sgpaExcludeFailedSubjects: false,
    cgpaIncludedSemesters: 'ALL',
    isActive: true,
  });
  logger.info('Academic rules created.');

  // ---- SEMESTERS ----
  const sem1 = await Semester.create({ programId: beTech._id, semesterNumber: 1, academicYear: '2022-2023', startDate: new Date('2022-07-01'), endDate: new Date('2022-11-30'), status: 'COMPLETED' });
  const sem2 = await Semester.create({ programId: beTech._id, semesterNumber: 2, academicYear: '2022-2023', startDate: new Date('2023-01-01'), endDate: new Date('2023-05-31'), status: 'COMPLETED' });
  const sem3 = await Semester.create({ programId: beTech._id, semesterNumber: 3, academicYear: '2023-2024', startDate: new Date('2023-07-01'), endDate: new Date('2023-11-30'), status: 'COMPLETED' });
  const sem4 = await Semester.create({ programId: beTech._id, semesterNumber: 4, academicYear: '2023-2024', startDate: new Date('2024-01-01'), endDate: new Date('2024-05-31'), status: 'COMPLETED' });
  const sem5 = await Semester.create({ programId: beTech._id, semesterNumber: 5, academicYear: '2024-2025', startDate: new Date('2024-07-01'), endDate: new Date('2024-11-30'), status: 'ONGOING' });
  logger.info('Semesters created.');

  // ---- SUBJECTS ----
  const subjects: Record<string, mongoose.Document> = {};

  // Semester 1
  subjects['MA3151'] = await Subject.create({ code: 'MA3151', name: 'Matrices and Calculus', credits: 4, departmentId: csDept._id, programId: beTech._id, applicableSemester: 1, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['PH3151'] = await Subject.create({ code: 'PH3151', name: 'Engineering Physics', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 1, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CY3151'] = await Subject.create({ code: 'CY3151', name: 'Engineering Chemistry', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 1, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3151'] = await Subject.create({ code: 'CS3151', name: 'Problem Solving and Python Programming', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 1, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3151L'] = await Subject.create({ code: 'CS3151L', name: 'Python Programming Lab', credits: 1.5, departmentId: csDept._id, programId: beTech._id, applicableSemester: 1, subjectType: 'PRACTICAL', internalMaxMarks: 60, externalMaxMarks: 40, totalMaxMarks: 100 });

  // Semester 2
  subjects['MA3251'] = await Subject.create({ code: 'MA3251', name: 'Statistics and Numerical Methods', credits: 4, departmentId: csDept._id, programId: beTech._id, applicableSemester: 2, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3251'] = await Subject.create({ code: 'CS3251', name: 'Programming in C', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 2, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['EC3251'] = await Subject.create({ code: 'EC3251', name: 'Circuit Analysis', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 2, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3291'] = await Subject.create({ code: 'CS3291', name: 'Data Structures Lab', credits: 1.5, departmentId: csDept._id, programId: beTech._id, applicableSemester: 2, subjectType: 'PRACTICAL', internalMaxMarks: 60, externalMaxMarks: 40, totalMaxMarks: 100 });

  // Semester 3
  subjects['MA3354'] = await Subject.create({ code: 'MA3354', name: 'Discrete Mathematics', credits: 4, departmentId: csDept._id, programId: beTech._id, applicableSemester: 3, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3351'] = await Subject.create({ code: 'CS3351', name: 'Digital Principles and Computer Organization', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 3, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3352'] = await Subject.create({ code: 'CS3352', name: 'Fundamentals of Data Science', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 3, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3391'] = await Subject.create({ code: 'CS3391', name: 'Object Oriented Programming', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 3, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });

  // Semester 4
  subjects['CS3491'] = await Subject.create({ code: 'CS3491', name: 'Artificial Intelligence and Machine Learning', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 4, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3492'] = await Subject.create({ code: 'CS3492', name: 'Database Management Systems', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 4, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3451'] = await Subject.create({ code: 'CS3451', name: 'Introduction to Operating Systems', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 4, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });
  subjects['CS3452'] = await Subject.create({ code: 'CS3452', name: 'Theory of Computation', credits: 3, departmentId: csDept._id, programId: beTech._id, applicableSemester: 4, subjectType: 'THEORY', internalMaxMarks: 40, externalMaxMarks: 60, totalMaxMarks: 100 });

  logger.info('Subjects created.');

  // ---- ADMIN USER ----
  const adminUser = await User.create({ name: 'Dr. Rajesh Kumar', email: 'admin@cehp.edu', passwordHash, role: 'ADMIN', accountStatus: 'ACTIVE' });

  // ---- EXAM OFFICER ----
  const examOfficer = await User.create({ name: 'Ms. Priya Nair', email: 'examofficer@cehp.edu', passwordHash, role: 'EXAM_OFFICER', accountStatus: 'ACTIVE' });

  // ---- HOD ----
  const hodUser = await User.create({ name: 'Dr. Suresh Babu', email: 'hod.cse@cehp.edu', passwordHash, role: 'HOD', accountStatus: 'ACTIVE', assignedDepartmentIds: [csDept._id] });
  await FacultyProfile.create({ userId: hodUser._id, employeeId: 'FAC001', departmentId: csDept._id, designation: 'Professor & HOD' });
  await User.findByIdAndUpdate(hodUser._id, { facultyProfileId: (await FacultyProfile.findOne({ userId: hodUser._id }))?._id });

  // ---- FACULTY ----
  const faculty1 = await User.create({ name: 'Dr. Meena Krishnan', email: 'faculty1@cehp.edu', passwordHash, role: 'FACULTY', accountStatus: 'ACTIVE' });
  const fac1Profile = await FacultyProfile.create({ userId: faculty1._id, employeeId: 'FAC002', departmentId: csDept._id, designation: 'Assistant Professor', assignedSubjectIds: [subjects['CS3391']._id, subjects['CS3491']._id] });
  await User.findByIdAndUpdate(faculty1._id, { facultyProfileId: fac1Profile._id });

  const faculty2 = await User.create({ name: 'Mr. Arun Selvam', email: 'faculty2@cehp.edu', passwordHash, role: 'FACULTY', accountStatus: 'ACTIVE' });
  const fac2Profile = await FacultyProfile.create({ userId: faculty2._id, employeeId: 'FAC003', departmentId: csDept._id, designation: 'Associate Professor', assignedSubjectIds: [subjects['MA3151']._id, subjects['MA3251']._id] });
  await User.findByIdAndUpdate(faculty2._id, { facultyProfileId: fac2Profile._id });

  logger.info('Staff users created.');

  // ---- STUDENTS ----
  const studentData = [
    { name: 'Arjun Sharma', email: 'student1@cehp.edu', regNo: '212222040001', batch: '2022-2026', sem: 5 },
    { name: 'Kavya Reddy', email: 'student2@cehp.edu', regNo: '212222040002', batch: '2022-2026', sem: 5 },
    { name: 'Mohammed Farhan', email: 'student3@cehp.edu', regNo: '212222040003', batch: '2022-2026', sem: 5 },
    { name: 'Deepika Sundar', email: 'student4@cehp.edu', regNo: '212222040004', batch: '2022-2026', sem: 5 },
    { name: 'Rajan Pillai', email: 'student5@cehp.edu', regNo: '212222040005', batch: '2022-2026', sem: 3 },
  ];

  const studentUsers: mongoose.Document[] = [];
  for (const s of studentData) {
    const user = await User.create({ name: s.name, email: s.email, passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' });
    const profile = await StudentProfile.create({
      userId: user._id,
      registrationNumber: s.regNo,
      departmentId: csDept._id,
      programId: beTech._id,
      admissionYear: 2022,
      batch: s.batch,
      currentSemester: s.sem,
    });
    await User.findByIdAndUpdate(user._id, { studentProfileId: profile._id });
    studentUsers.push(user);
  }

  logger.info('Student users created.');

  // ---- EXAMINATIONS ----
  const exam1 = await Examination.create({ name: 'Nov/Dec 2022 - Semester I', examinationType: 'EXTERNAL', semesterId: sem1._id, programId: beTech._id, academicYear: '2022-2023', startDate: new Date('2022-11-15'), endDate: new Date('2022-11-30'), status: 'COMPLETED', publicationStatus: 'PUBLISHED', createdBy: adminUser._id, publishedAt: new Date('2022-12-20') });
  const exam2 = await Examination.create({ name: 'Apr/May 2023 - Semester II', examinationType: 'EXTERNAL', semesterId: sem2._id, programId: beTech._id, academicYear: '2022-2023', startDate: new Date('2023-04-15'), endDate: new Date('2023-04-30'), status: 'COMPLETED', publicationStatus: 'PUBLISHED', createdBy: adminUser._id, publishedAt: new Date('2023-05-25') });
  const exam3 = await Examination.create({ name: 'Nov/Dec 2023 - Semester III', examinationType: 'EXTERNAL', semesterId: sem3._id, programId: beTech._id, academicYear: '2023-2024', startDate: new Date('2023-11-15'), endDate: new Date('2023-11-30'), status: 'COMPLETED', publicationStatus: 'PUBLISHED', createdBy: adminUser._id, publishedAt: new Date('2023-12-20') });
  const exam4 = await Examination.create({ name: 'Apr/May 2024 - Semester IV', examinationType: 'EXTERNAL', semesterId: sem4._id, programId: beTech._id, academicYear: '2023-2024', startDate: new Date('2024-04-15'), endDate: new Date('2024-04-30'), status: 'COMPLETED', publicationStatus: 'PUBLISHED', createdBy: adminUser._id, publishedAt: new Date('2024-05-25') });
  const exam5 = await Examination.create({ name: 'Nov/Dec 2024 - Semester V (Pending)', examinationType: 'EXTERNAL', semesterId: sem5._id, programId: beTech._id, academicYear: '2024-2025', startDate: new Date('2024-11-15'), endDate: new Date('2024-11-30'), status: 'UPCOMING', publicationStatus: 'DRAFT', createdBy: adminUser._id });

  logger.info('Examinations created.');

  // ---- RESULTS ----
  const academicRule = {
    minPassPercentage: 50,
    sgpaExcludeFailedSubjects: false,
    gradeThresholds: thresholds,
  } as any;

  async function createResult(
    studentId: mongoose.Types.ObjectId,
    subjectKey: string,
    semesterId: mongoose.Types.ObjectId,
    examinationId: mongoose.Types.ObjectId,
    internal: number,
    external: number,
    attempt = 1
  ) {
    const subject = subjects[subjectKey] as any;
    const total = internal + external;
    const max = subject.totalMaxMarks;
    const pct = (total / max) * 100;
    const { grade, gradePoint } = calculateGrade(pct, thresholds);
    const status = determineResultStatus(total, max, internal, external, academicRule);
    return ResultRecord.create({
      studentId,
      subjectId: subject._id,
      semesterId,
      examinationId,
      internalMarks: internal,
      externalMarks: external,
      totalMarks: total,
      maximumMarks: max,
      internalMaxMarks: subject.internalMaxMarks,
      externalMaxMarks: subject.externalMaxMarks,
      credits: subject.credits,
      grade,
      gradePoint,
      resultStatus: status,
      attemptNumber: attempt,
      isArrear: attempt > 1,
      publicationStatus: 'PUBLISHED',
      enteredBy: faculty1._id,
      approvedBy: examOfficer._id,
      publishedAt: new Date(),
    });
  }

  // Student 1 (Arjun Sharma) - Good performance
  const s1 = studentUsers[0] as any;
  await createResult(s1._id, 'MA3151', sem1._id, exam1._id, 35, 52, 1);
  await createResult(s1._id, 'PH3151', sem1._id, exam1._id, 33, 48, 1);
  await createResult(s1._id, 'CY3151', sem1._id, exam1._id, 37, 55, 1);
  await createResult(s1._id, 'CS3151', sem1._id, exam1._id, 38, 57, 1);
  await createResult(s1._id, 'CS3151L', sem1._id, exam1._id, 55, 36, 1);
  await createResult(s1._id, 'MA3251', sem2._id, exam2._id, 34, 50, 1);
  await createResult(s1._id, 'CS3251', sem2._id, exam2._id, 36, 54, 1);
  await createResult(s1._id, 'EC3251', sem2._id, exam2._id, 30, 42, 1);
  await createResult(s1._id, 'CS3291', sem2._id, exam2._id, 52, 38, 1);
  await createResult(s1._id, 'MA3354', sem3._id, exam3._id, 32, 46, 1);
  await createResult(s1._id, 'CS3351', sem3._id, exam3._id, 36, 55, 1);
  await createResult(s1._id, 'CS3352', sem3._id, exam3._id, 38, 58, 1);
  await createResult(s1._id, 'CS3391', sem3._id, exam3._id, 37, 56, 1);
  await createResult(s1._id, 'CS3491', sem4._id, exam4._id, 36, 58, 1);
  await createResult(s1._id, 'CS3492', sem4._id, exam4._id, 38, 56, 1);
  await createResult(s1._id, 'CS3451', sem4._id, exam4._id, 35, 52, 1);
  await createResult(s1._id, 'CS3452', sem4._id, exam4._id, 33, 49, 1);

  // Student 2 (Kavya Reddy) - Excellent performance
  const s2 = studentUsers[1] as any;
  await createResult(s2._id, 'MA3151', sem1._id, exam1._id, 39, 58, 1);
  await createResult(s2._id, 'PH3151', sem1._id, exam1._id, 37, 56, 1);
  await createResult(s2._id, 'CY3151', sem1._id, exam1._id, 38, 57, 1);
  await createResult(s2._id, 'CS3151', sem1._id, exam1._id, 40, 59, 1);
  await createResult(s2._id, 'CS3151L', sem1._id, exam1._id, 58, 40, 1);
  await createResult(s2._id, 'MA3251', sem2._id, exam2._id, 38, 57, 1);
  await createResult(s2._id, 'CS3251', sem2._id, exam2._id, 39, 58, 1);
  await createResult(s2._id, 'EC3251', sem2._id, exam2._id, 36, 54, 1);
  await createResult(s2._id, 'CS3291', sem2._id, exam2._id, 57, 39, 1);
  await createResult(s2._id, 'MA3354', sem3._id, exam3._id, 38, 57, 1);
  await createResult(s2._id, 'CS3351', sem3._id, exam3._id, 39, 58, 1);
  await createResult(s2._id, 'CS3352', sem3._id, exam3._id, 40, 59, 1);
  await createResult(s2._id, 'CS3391', sem3._id, exam3._id, 39, 58, 1);
  await createResult(s2._id, 'CS3491', sem4._id, exam4._id, 40, 59, 1);
  await createResult(s2._id, 'CS3492', sem4._id, exam4._id, 39, 58, 1);
  await createResult(s2._id, 'CS3451', sem4._id, exam4._id, 38, 57, 1);
  await createResult(s2._id, 'CS3452', sem4._id, exam4._id, 37, 56, 1);

  // Student 3 (Mohammed Farhan) - With arrears
  const s3 = studentUsers[2] as any;
  await createResult(s3._id, 'MA3151', sem1._id, exam1._id, 28, 40, 1); // FAIL
  await createResult(s3._id, 'PH3151', sem1._id, exam1._id, 31, 44, 1);
  await createResult(s3._id, 'CY3151', sem1._id, exam1._id, 30, 42, 1);
  await createResult(s3._id, 'CS3151', sem1._id, exam1._id, 35, 50, 1);
  await createResult(s3._id, 'CS3151L', sem1._id, exam1._id, 45, 30, 1);
  // Attempt 2 for MA3151 - still failing (arrear)
  await createResult(s3._id, 'MA3151', sem2._id, exam2._id, 25, 38, 2);
  await createResult(s3._id, 'CS3251', sem2._id, exam2._id, 30, 43, 1);
  await createResult(s3._id, 'EC3251', sem2._id, exam2._id, 25, 38, 1); // FAIL
  await createResult(s3._id, 'CS3291', sem2._id, exam2._id, 42, 30, 1);
  await createResult(s3._id, 'MA3354', sem3._id, exam3._id, 30, 44, 1);
  await createResult(s3._id, 'CS3351', sem3._id, exam3._id, 32, 46, 1);
  await createResult(s3._id, 'CS3352', sem3._id, exam3._id, 31, 45, 1);
  await createResult(s3._id, 'CS3391', sem3._id, exam3._id, 30, 43, 1);
  await createResult(s3._id, 'CS3491', sem4._id, exam4._id, 32, 46, 1);
  await createResult(s3._id, 'CS3492', sem4._id, exam4._id, 30, 44, 1);
  await createResult(s3._id, 'CS3451', sem4._id, exam4._id, 28, 42, 1);
  await createResult(s3._id, 'CS3452', sem4._id, exam4._id, 26, 38, 1); // FAIL

  logger.info('Results seeded.');

  // Add notifications
  await Notification.create({
    recipientUserId: s1._id,
    title: 'Semester IV Results Published',
    message: 'Your Semester IV results have been published. Login to view your grades.',
    category: 'RESULT',
  });
  await Notification.create({
    recipientUserId: s3._id,
    title: 'Arrear Subjects Identified',
    message: 'You have active arrears. Please contact your academic advisor for support.',
    category: 'RESULT',
  });

  logger.info('Notifications created.');

  logger.info('\n✅ SEED COMPLETE!\n');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('DEMO LOGIN CREDENTIALS (Development Only)');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('Admin:         admin@cehp.edu        / Demo@1234');
  logger.info('Exam Officer:  examofficer@cehp.edu  / Demo@1234');
  logger.info('HOD:           hod.cse@cehp.edu      / Demo@1234');
  logger.info('Faculty:       faculty1@cehp.edu     / Demo@1234');
  logger.info('Student 1:     student1@cehp.edu     / Demo@1234  (Good performer)');
  logger.info('Student 2:     student2@cehp.edu     / Demo@1234  (Excellent performer)');
  logger.info('Student 3:     student3@cehp.edu     / Demo@1234  (Has arrears)');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
