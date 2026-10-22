import mongoose, { Document, Schema } from 'mongoose';

export interface IProgram extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  departmentId: mongoose.Types.ObjectId;
  duration: number; // years
  totalSemesters: number;
  creditSystem: 'CGPA' | 'PERCENTAGE' | 'GRADE';
  degree: string; // B.E., B.Tech, M.E., etc.
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const programSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    duration: { type: Number, required: true, min: 1, max: 10 },
    totalSemesters: { type: Number, required: true, min: 1, max: 20 },
    creditSystem: { type: String, enum: ['CGPA', 'PERCENTAGE', 'GRADE'], default: 'CGPA' },
    degree: { type: String, required: true, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

programSchema.index({ departmentId: 1 });

export const Program = mongoose.model<IProgram>('Program', programSchema);
