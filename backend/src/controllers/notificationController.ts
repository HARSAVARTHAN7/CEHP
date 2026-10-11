import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/AppError';

// GET /api/v1/notifications
export async function listNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20', unreadOnly } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter: Record<string, unknown> = { recipientUserId: req.userId };
    if (unreadOnly === 'true') filter.readAt = { $exists: false };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientUserId: req.userId, readAt: { $exists: false } }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
}

// PATCH /api/v1/notifications/:id/read
export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientUserId: req.userId, // Ensure ownership
    });
    if (!notification) return next(new AppError('Notification not found', 404));
    notification.readAt = new Date();
    await notification.save();
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
}

// PATCH /api/v1/notifications/read-all
export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await Notification.updateMany(
      { recipientUserId: req.userId, readAt: { $exists: false } },
      { readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
}
