import mongoose, { Document, Schema } from 'mongoose';

export type ResultStatus = 'PASS' | 'FAIL' | 'ABSENT' | 'WITHHELD' | 'INCOMPLETE';
export type PublicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED';

export interface IResultRecord extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  semesterId: mongoose.Types.ObjectId;
  examinationId: mongoose.Types.ObjectId;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  maximumMarks: number;
  internalMaxMarks: number;
  externalMaxMarks: number;
  credits: number;
  grade: string;
  gradePoint: number;
  resultStatus: ResultStatus;
  attemptNumber: number;
  isArrear: boolean;
  publicationStatus: PublicationStatus;
  enteredBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resultRecordSchema = new Schema<IResultRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    examinationId: { type: Schema.Types.ObjectId, ref: 'Examination', required: true },
    internalMarks: { type: Number, required: true, min: 0 },
    externalMarks: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 0 },
    maximumMarks: { type: Number, required: true, default: 100 },
    internalMaxMarks: { type: Number, required: true, default: 40 },
    externalMaxMarks: { type: Number, required: true, default: 60 },
    credits: { type: Number, required: true, min: 0 },
    grade: { type: String, required: true },
    gradePoint: { type: Number, required: true, min: 0, max: 10 },
    resultStatus: {
      type: String,
      enum: ['PASS', 'FAIL', 'ABSENT', 'WITHHELD', 'INCOMPLETE'],
      required: true,
    },
    attemptNumber: { type: Number, required: true, default: 1, min: 1 },
    isArrear: { type: Boolean, default: false },
    publicationStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'],
      default: 'DRAFT',
    },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
    remarks: { type: String },
  },
  { timestamps: true }
);

// Prevent duplicate results for the same student-subject-exam-attempt
resultRecordSchema.index(
  { studentId: 1, subjectId: 1, examinationId: 1, attemptNumber: 1 },
  { unique: true }
);
resultRecordSchema.index({ studentId: 1, semesterId: 1 });
resultRecordSchema.index({ examinationId: 1, publicationStatus: 1 });
resultRecordSchema.index({ studentId: 1, publicationStatus: 1 });

export const ResultRecord = mongoose.model<IResultRecord>('ResultRecord', resultRecordSchema);
