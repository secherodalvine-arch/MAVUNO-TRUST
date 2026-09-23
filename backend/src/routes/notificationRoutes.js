import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

/**
 * GET /api/notifications
 * Get current user's notifications (latest 50, unread first)
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ read: 1, createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, error: { message: 'Notification not found.' } });
    res.json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    await Notification.updateMany({ userId, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const result = await Notification.findOneAndDelete({ _id: req.params.id, userId });
    if (!result) return res.status(404).json({ success: false, error: { message: 'Notification not found.' } });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications
 * Clear all notifications for current user
 */
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    await Notification.deleteMany({ userId });
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (err) {
    next(err);
  }
});

export default router;
