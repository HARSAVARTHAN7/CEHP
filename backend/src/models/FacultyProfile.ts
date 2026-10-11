import mongoose, { Document, Schema } from 'mongoose';

export interface IFacultyProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  departmentId: mongoose.Types.ObjectId;
  designation: string;
  assignedSubjectIds: mongoose.Types.ObjectId[];
  qualification?: string;
  specialization?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const facultyProfileSchema = new Schema<IFacultyProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    designation: { type: String, required: true, trim: true },
    assignedSubjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    qualification: { type: String },
    specialization: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

facultyProfileSchema.index({ departmentId: 1 });

export const FacultyProfile = mongoose.model<IFacultyProfile>('FacultyProfile', facultyProfileSchema);
