import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['WELCOME', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'TRANSACTION_CREATED',
           'TRANSACTION_COMPLETED', 'MESSAGE_RECEIVED', 'DISPUTE_RAISED', 'GENERAL'],
    default: 'GENERAL',
  },
  title: { type: String, required: true },
  body:  { type: String, required: true },
  link:  { type: String, default: null }, // Route to navigate to on click
  read:  { type: Boolean, default: false },
  meta:  { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);

/**
 * Create a notification for a user and optionally broadcast via WebSocket.
 * @param {object} data - { userId, type, title, body, link?, meta? }
 */
export async function createNotification({ userId, type = 'GENERAL', title, body, link = null, meta = {} }) {
  const notif = await Notification.create({ userId, type, title, body, link, meta });
  try {
    const { getIO } = await import('../socket.js');
    const io = getIO();
    if (io) {
      io.to(`user:${userId.toString()}`).emit('new_notification', notif);
    }
  } catch (err) {
    // Socket might not be initialized or active
  }
  return notif;
}
