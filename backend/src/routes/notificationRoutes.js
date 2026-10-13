import { Router } from 'express';
import { Notification, createNotification } from '../models/Notification.js';
import { requireAuth } from '../middleware/requireAuth.js';
import Offer from '../models/Offer.js';
import Transaction from '../models/Transaction.js';
import Complaint from '../models/Complaint.js';
import FarmerCropListing from '../models/FarmerCropListing.js';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

/**
 * Helper to inspect ongoing activities, pending offers, transactions, and complaints,
 * and automatically synchronize actionable reminder notifications into the user's notification box.
 */
export async function checkAndSyncReminders(userId, userRole) {
  const reminders = [];

  try {
    // 1. Pending incoming offers awaiting user response
    // If dealer sent offer, farmer is recipient. If farmer sent offer, dealer is recipient.
    const pendingOffers = await Offer.find({
      $or: [
        { farmerId: userId, initiatedBy: 'DEALER', status: 'PENDING' },
        { dealerId: userId, initiatedBy: 'FARMER', status: 'PENDING' }
      ]
    }).populate('listingId').sort({ createdAt: -1 }).limit(5);

    for (const off of pendingOffers) {
      const cropName = (off.listingId && off.listingId.cropName) || 'Crop';
      reminders.push({
        reminderKey: `pending_offer_${off._id}`,
        title: `Pending Offer: ${cropName}`,
        body: `You have an incoming trade offer of ${off.quantity} ${off.unit} at KES ${off.proposedPricePerUnit.toLocaleString()} awaiting your review.`,
        link: '/offers',
        actionLabel: 'Review Offer',
        category: 'OFFER',
        priority: 'high',
        type: 'REMINDER',
        itemId: off._id.toString(),
      });
    }

    // 2. Counter-offers awaiting user response
    const counteredOffers = await Offer.find({
      $or: [
        { farmerId: userId, initiatedBy: 'DEALER', status: 'COUNTERED' },
        { dealerId: userId, initiatedBy: 'FARMER', status: 'COUNTERED' }
      ]
    }).populate('listingId').sort({ updatedAt: -1 }).limit(5);

    for (const off of counteredOffers) {
      const cropName = (off.listingId && off.listingId.cropName) || 'Crop';
      reminders.push({
        reminderKey: `countered_offer_${off._id}`,
        title: `Counter-Offer: ${cropName}`,
        body: `A revised counter-offer is awaiting your decision for ${off.quantity} ${off.unit}.`,
        link: '/offers',
        actionLabel: 'View Counter-Offer',
        category: 'OFFER',
        priority: 'high',
        type: 'REMINDER',
        itemId: off._id.toString(),
      });
    }

    // 3. Ongoing / in-progress or disputed transactions
    const ongoingTxs = await Transaction.find({
      $or: [{ farmerId: userId }, { dealerId: userId }],
      status: { $in: ['AGREED', 'IN_PROGRESS', 'DISPUTED'] }
    }).sort({ updatedAt: -1 }).limit(6);

    for (const tx of ongoingTxs) {
      const code = tx._id.toString().slice(-6).toUpperCase();
      let title = `Active Deal: ${tx.cropName}`;
      let body = `Transaction #${code} is active. Track progress and coordinate in the deal room.`;
      let actionLabel = 'Track Transaction';
      let priority = 'medium';

      if (tx.status === 'AGREED') {
        title = `Terms Agreed: ${tx.cropName}`;
        body = `Transaction #${code} has been agreed upon. Set up expected delivery method and date.`;
        actionLabel = 'Arrange Fulfilment';
        priority = 'high';
      } else if (tx.status === 'DISPUTED') {
        title = `Dispute on Deal: ${tx.cropName}`;
        body = `Transaction #${code} has an open dispute under review. View details and communicate.`;
        actionLabel = 'Review Dispute';
        priority = 'high';
      } else if (tx.status === 'IN_PROGRESS') {
        const fStatus = tx.fulfilment?.status;
        if (fStatus === 'FULFILLED') {
          title = `Delivered: ${tx.cropName}`;
          body = `Goods for Transaction #${code} are delivered. Review delivery and mark completed.`;
          actionLabel = 'Complete Deal';
          priority = 'high';
        } else if (fStatus === 'IN_PROGRESS') {
          title = `In Transit: ${tx.cropName}`;
          body = `Crops for Transaction #${code} are in transit. Confirm receipt upon arrival.`;
          actionLabel = 'Track Delivery';
          priority = 'medium';
        } else {
          title = `In Progress: ${tx.cropName}`;
          body = `Transaction #${code} is in progress. Update delivery details when ready.`;
          actionLabel = 'Update Status';
          priority = 'medium';
        }
      }

      reminders.push({
        reminderKey: `tx_state_${tx._id}_${tx.status}_${tx.fulfilment?.status || 'none'}`,
        title,
        body,
        link: '/transactions',
        actionLabel,
        category: 'TRANSACTION',
        priority,
        type: 'REMINDER',
        itemId: tx._id.toString(),
      });
    }

    // 4. Open Complaints under review
    const openComplaints = await Complaint.find({
      reporterId: userId,
      status: { $in: ['OPEN', 'UNDER_REVIEW'] }
    }).sort({ createdAt: -1 }).limit(3);

    for (const c of openComplaints) {
      reminders.push({
        reminderKey: `complaint_${c._id}`,
        title: `Case #${c.caseId} Under Review`,
        body: `Your case regarding ${c.category.toLowerCase().replace(/_/g, ' ')} is currently being processed by the KENAFF Rights Centre.`,
        link: '/farmer/complaints',
        actionLabel: 'View Case',
        category: 'COMPLAINT',
        priority: 'low',
        type: 'REMINDER',
        itemId: c._id.toString(),
      });
    }

    // 5. Farmer with no active crop listings
    const normalizedRole = (userRole || '').toUpperCase().trim();
    if (normalizedRole === 'FARMER') {
      const activeListingsCount = await FarmerCropListing.countDocuments({
        farmerId: userId,
        status: 'ACTIVE'
      });
      if (activeListingsCount === 0) {
        reminders.push({
          reminderKey: `no_crops_${userId}`,
          title: 'List Your Harvest',
          body: 'You have no active crop listings. Add your upcoming harvest so verified dealers can send purchase offers.',
          link: '/farmer/crops',
          actionLabel: 'List Crops Now',
          category: 'LISTING',
          priority: 'low',
          type: 'REMINDER',
          itemId: userId.toString(),
        });
      }
    } else {
      // Non-farmer accounts (e.g. DEALER/BROKER) must never receive crop listing reminders.
      // Clean up any stale no_crops notifications in the database for this user.
      await Notification.deleteMany({
        userId,
        'meta.reminderKey': `no_crops_${userId}`
      });
    }

    // For each detected reminder, ensure a Notification document exists in MongoDB
    // so it shows in the notification bell / history drawer!
    for (const rem of reminders) {
      const existing = await Notification.findOne({
        userId,
        'meta.reminderKey': rem.reminderKey,
      });

      if (!existing) {
        await createNotification({
          userId,
          type: 'REMINDER',
          title: rem.title,
          body: rem.body,
          link: rem.link,
          meta: {
            reminderKey: rem.reminderKey,
            actionLabel: rem.actionLabel,
            category: rem.category,
            priority: rem.priority,
            itemId: rem.itemId,
          }
        });
      }
    }
  } catch (err) {
    console.warn('[Notification Reminder Sync Error]', err.message);
  }

  return reminders;
}

/**
 * GET /api/notifications
 * Get current user's notifications (latest 50, unread first).
 * Automatically syncs reminders so actionable notifications are always updated.
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    await checkAndSyncReminders(userId, req.user.role);

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
 * GET /api/notifications/reminders
 * Specifically fetches actionable pending activity reminders for in-app interactive popup.
 */
router.get('/reminders', async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const reminders = await checkAndSyncReminders(userId, req.user.role);

    // Retrieve corresponding notification records to know which are already read
    const reminderKeys = reminders.map(r => r.reminderKey);
    const existingNotifs = await Notification.find({
      userId,
      'meta.reminderKey': { $in: reminderKeys }
    }).lean();

    const notifMap = new Map();
    existingNotifs.forEach(n => {
      if (n.meta && n.meta.reminderKey) {
        notifMap.set(n.meta.reminderKey, n);
      }
    });

    const enrichedReminders = reminders
      .filter(r => {
        if (req.user?.role === 'DEALER' && (r.category === 'LISTING' || r.link?.startsWith('/farmer/crops') || r.reminderKey?.startsWith('no_crops_'))) {
          return false;
        }
        return true;
      })
      .map(r => {
        const match = notifMap.get(r.reminderKey);
        return {
          ...r,
          notificationId: match ? match._id.toString() : null,
          read: match ? !!match.read : false,
          createdAt: match ? match.createdAt : new Date().toISOString(),
        };
      });

    // Unread reminders prioritized for interactive popup
    const unreadReminders = enrichedReminders.filter(r => !r.read);

    res.json({
      success: true,
      data: {
        reminders: enrichedReminders,
        unreadReminders,
        hasPendingActivities: unreadReminders.length > 0
      }
    });
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
