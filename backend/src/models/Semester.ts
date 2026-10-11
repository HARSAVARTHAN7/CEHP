import mongoose, { Document, Schema } from 'mongoose';

export interface ISemester extends Document {
  _id: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  semesterNumber: number;
  academicYear: string; // e.g. "2024-2025"
  startDate: Date;
  endDate: Date;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

const semesterSchema = new Schema<ISemester>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    semesterNumber: { type: Number, required: true, min: 1, max: 20 },
    academicYear: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED'], default: 'UPCOMING' },
  },
  { timestamps: true }
);

semesterSchema.index({ programId: 1, semesterNumber: 1, academicYear: 1 }, { unique: true });

export const Semester = mongoose.model<ISemester>('Semester', semesterSchema);
