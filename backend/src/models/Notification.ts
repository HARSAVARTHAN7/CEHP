import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientUserId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  category: 'RESULT' | 'MARKS' | 'APPROVAL' | 'SYSTEM' | 'TRANSCRIPT' | 'STUDY_PLAN';
  readAt?: Date;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ['RESULT', 'MARKS', 'APPROVAL', 'SYSTEM', 'TRANSCRIPT', 'STUDY_PLAN'],
      required: true,
    },
    readAt: { type: Date },
    link: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, readAt: 1 });
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
