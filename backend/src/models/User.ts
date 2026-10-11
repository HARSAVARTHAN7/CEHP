import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'ADMIN' | 'EXAM_OFFICER' | 'HOD' | 'FACULTY' | 'STUDENT';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  accountStatus: AccountStatus;
  studentProfileId?: mongoose.Types.ObjectId;
  facultyProfileId?: mongoose.Types.ObjectId;
  assignedDepartmentIds: mongoose.Types.ObjectId[];
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['ADMIN', 'EXAM_OFFICER', 'HOD', 'FACULTY', 'STUDENT'],
      required: true,
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'],
      default: 'ACTIVE',
    },
    studentProfileId: { type: Schema.Types.ObjectId, ref: 'StudentProfile' },
    facultyProfileId: { type: Schema.Types.ObjectId, ref: 'FacultyProfile' },
    assignedDepartmentIds: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    lastLoginAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
