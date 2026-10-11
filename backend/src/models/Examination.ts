import mongoose, { Document, Schema } from 'mongoose';

export interface IExamination extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  examinationType: 'INTERNAL' | 'EXTERNAL' | 'ARREAR' | 'SUPPLEMENTARY' | 'PRACTICAL';
  semesterId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  publicationStatus: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED';
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const examinationSchema = new Schema<IExamination>(
  {
    name: { type: String, required: true, trim: true },
    examinationType: {
      type: String,
      enum: ['INTERNAL', 'EXTERNAL', 'ARREAR', 'SUPPLEMENTARY', 'PRACTICAL'],
      required: true,
    },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    academicYear: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED'], default: 'UPCOMING' },
    publicationStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'],
      default: 'DRAFT',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

examinationSchema.index({ semesterId: 1, publicationStatus: 1 });
examinationSchema.index({ programId: 1, academicYear: 1 });

export const Examination = mongoose.model<IExamination>('Examination', examinationSchema);
