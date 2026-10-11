import mongoose, { Document, Schema } from 'mongoose';

export interface IGradeThreshold {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  gradePoint: number;
  description: string;
}

export interface IAcademicRule extends Document {
  _id: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  effectiveFrom: string; // academic year e.g. "2022-2023"
  minPassPercentage: number; // e.g. 50 for 50%
  minInternalPassMarks?: number;
  minExternalPassMarks?: number;
  gradeThresholds: IGradeThreshold[];
  sgpaExcludeFailedSubjects: boolean;
  cgpaIncludedSemesters: 'ALL' | 'BEST_N';
  bestN?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gradeThresholdSchema = new Schema<IGradeThreshold>({
  minPercentage: { type: Number, required: true },
  maxPercentage: { type: Number, required: true },
  grade: { type: String, required: true },
  gradePoint: { type: Number, required: true },
  description: { type: String, required: true },
});

const academicRuleSchema = new Schema<IAcademicRule>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    effectiveFrom: { type: String, required: true },
    minPassPercentage: { type: Number, required: true, default: 50 },
    minInternalPassMarks: { type: Number },
    minExternalPassMarks: { type: Number },
    gradeThresholds: [gradeThresholdSchema],
    sgpaExcludeFailedSubjects: { type: Boolean, default: false },
    cgpaIncludedSemesters: { type: String, enum: ['ALL', 'BEST_N'], default: 'ALL' },
    bestN: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

academicRuleSchema.index({ programId: 1, isActive: 1 });

export const AcademicRule = mongoose.model<IAcademicRule>('AcademicRule', academicRuleSchema);
