import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  credits: number;
  departmentId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  applicableSemester: number;
  subjectType: 'THEORY' | 'PRACTICAL' | 'PROJECT' | 'ELECTIVE' | 'AUDIT';
  internalMaxMarks: number;
  externalMaxMarks: number;
  totalMaxMarks: number;
  activeStatus: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 0, max: 10 },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    applicableSemester: { type: Number, required: true, min: 1, max: 20 },
    subjectType: {
      type: String,
      enum: ['THEORY', 'PRACTICAL', 'PROJECT', 'ELECTIVE', 'AUDIT'],
      default: 'THEORY',
    },
    internalMaxMarks: { type: Number, required: true, default: 40 },
    externalMaxMarks: { type: Number, required: true, default: 60 },
    totalMaxMarks: { type: Number, required: true, default: 100 },
    activeStatus: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

subjectSchema.index({ programId: 1, applicableSemester: 1 });
subjectSchema.index({ departmentId: 1 });

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
