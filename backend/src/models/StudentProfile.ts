import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  registrationNumber: string;
  departmentId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  admissionYear: number;
  batch: string;
  currentSemester: number;
  academicStatus: 'REGULAR' | 'LATERAL_ENTRY' | 'DETAINED' | 'ALUMNI' | 'WITHDRAWN';
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    admissionYear: { type: Number, required: true },
    batch: { type: String, required: true, trim: true },
    currentSemester: { type: Number, required: true, min: 1, max: 12 },
    academicStatus: {
      type: String,
      enum: ['REGULAR', 'LATERAL_ENTRY', 'DETAINED', 'ALUMNI', 'WITHDRAWN'],
      default: 'REGULAR',
    },
    dateOfBirth: { type: Date },
    gender: { type: String },
    phone: { type: String },
    address: { type: String },
    guardianName: { type: String },
    guardianPhone: { type: String },
  },
  { timestamps: true }
);

studentProfileSchema.index({ departmentId: 1 });
studentProfileSchema.index({ programId: 1 });
studentProfileSchema.index({ batch: 1 });

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', studentProfileSchema);
