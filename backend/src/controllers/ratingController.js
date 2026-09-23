import Rating from '../models/Rating.js';
import Transaction from '../models/Transaction.js';
import AuditLog, { AuditAction, AuditResourceType } from '../models/AuditLog.js';
import User from '../models/User.js';
import { createNotification } from '../models/Notification.js';
/**
 * Submit a rating for a transaction.
 * Only participants (farmer or dealer) can rate.
 * They rate the OTHER participant.
 * Cannot rate oneself, cannot rate more than once per transaction.
 */
export const submitRating = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        const authRole = req.user?.role;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { transactionId, rating, comment } = req.body;
        if (!transactionId || !rating) {
            res.status(400).json({ success: false, error: { message: 'Transaction ID and rating are required.' } });
            return;
        }
        // Input validation
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            res.status(400).json({ success: false, error: { message: 'Rating must be an integer between 1 and 5.' } });
            return;
        }
        const transaction = await Transaction.findById(transactionId).exec();
        if (!transaction) {
            res.status(404).json({ success: false, error: { message: 'Transaction not found.' } });
            return;
        }
        // Authorize participant
        const isFarmer = transaction.farmerId.toString() === authUserId;
        const isDealer = transaction.dealerId.toString() === authUserId;
        if (!isFarmer && !isDealer) {
            res.status(403).json({ success: false, error: { message: 'Unauthorized. You are not a participant in this transaction.' } });
            return;
        }
        // Derive reviewee
        const reviewedUserId = isFarmer ? transaction.dealerId : transaction.farmerId;
        // Check for duplicate manually to provide a clear error message (though Mongoose unique index also protects us)
        const existingRating = await Rating.findOne({ transactionId, reviewerId: authUserId });
        if (existingRating) {
            res.status(409).json({ success: false, error: { message: 'You have already rated this transaction.' } });
            return;
        }
        // Create the rating
        const newRating = new Rating({
            transactionId,
            reviewerId: authUserId,
            reviewedUserId,
            rating,
            comment
        });
        await newRating.save();
        await AuditLog.create({
            actorId: authUserId,
            actorRole: authRole || 'UNKNOWN',
            action: AuditAction.CREATE,
            resourceType: AuditResourceType.RATING,
            resourceId: newRating._id.toString(),
            details: { transactionId }
        });

        // Notify reviewed user
        try {
            const reviewer = await User.findById(authUserId).select('fullName').exec();
            const reviewerName = reviewer?.fullName || 'Partner';
            await createNotification({
                userId: reviewedUserId,
                type: 'GENERAL',
                title: 'New Rating Received ⭐',
                body: `${reviewerName} gave you a ${rating}-star rating for transaction ${transaction.cropName}.`,
                link: '/transactions',
                meta: { transactionId: transaction._id, rating }
            });
        } catch (notifErr) {
            console.error('Failed to dispatch rating notification:', notifErr);
        }

        res.status(201).json({ success: true, data: newRating });
    }
    catch (err) {
        next(err);
    }
};
/**
 * Get ratings for a specific transaction.
 * IDOR protected: Only participants can view the ratings of their transaction.
 */
export const getTransactionRatings = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { transactionId } = req.params;
        const transaction = await Transaction.findById(transactionId).exec();
        if (!transaction) {
            res.status(404).json({ success: false, error: { message: 'Transaction not found.' } });
            return;
        }
        const isFarmer = transaction.farmerId.toString() === authUserId;
        const isDealer = transaction.dealerId.toString() === authUserId;
        if (!isFarmer && !isDealer) {
            res.status(403).json({ success: false, error: { message: 'Unauthorized access to transaction ratings.' } });
            return;
        }
        const ratings = await Rating.find({ transactionId })
            .populate('reviewerId', 'fullName _id')
            .populate('reviewedUserId', 'fullName _id')
            .exec();
        res.json({ success: true, data: ratings });
    }
    catch (err) {
        next(err);
    }
};
