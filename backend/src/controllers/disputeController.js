import Dispute, { DisputeCategory, DisputeStatus } from '../models/Dispute.js';
import Transaction, { TransactionStatus } from '../models/Transaction.js';
import User from '../models/User.js';
import { createNotification } from '../models/Notification.js';
const getCleanId = (val) => {
    if (!val)
        return '';
    if (typeof val === 'string')
        return val;
    if (val._id)
        return typeof val._id === 'string' ? val._id : val._id.toString();
    if (typeof val.toString === 'function')
        return val.toString();
    return String(val);
};
/**
 * Open a new private dispute for an eligible transaction
 */
export const createDispute = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { transactionId, category, description, evidenceInfo } = req.body;
        if (!transactionId) {
            res.status(400).json({ success: false, error: { message: 'Transaction ID is required.' } });
            return;
        }
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            res.status(404).json({ success: false, error: { message: 'Transaction not found.' } });
            return;
        }
        const farmerIdStr = getCleanId(transaction.farmerId);
        const dealerIdStr = getCleanId(transaction.dealerId);
        const cleanAuthUserId = getCleanId(authUserId);
        if (farmerIdStr !== cleanAuthUserId && dealerIdStr !== cleanAuthUserId) {
            res.status(403).json({ success: false, error: { message: 'Unauthorized access to transaction.' } });
            return;
        }
        if (transaction.status === TransactionStatus.CANCELLED) {
            res.status(400).json({
                success: false,
                error: { message: 'Disputes cannot be opened for cancelled transactions.' }
            });
            return;
        }
        if (!category || !Object.values(DisputeCategory).includes(category)) {
            res.status(400).json({
                success: false,
                error: { message: `Dispute category is required and must be one of: ${Object.values(DisputeCategory).join(', ')}.` }
            });
            return;
        }
        if (!description || typeof description !== 'string' || description.trim().length < 10) {
            res.status(400).json({
                success: false,
                error: { message: 'Dispute description is required and must be at least 10 characters long.' }
            });
            return;
        }
        // Check for existing active OPEN dispute by this user for this transaction
        const existingActiveDispute = await Dispute.findOne({
            transactionId,
            openedBy: cleanAuthUserId,
            status: DisputeStatus.OPEN
        });
        if (existingActiveDispute) {
            res.status(400).json({
                success: false,
                error: { message: 'An active dispute case is already open for this transaction.' }
            });
            return;
        }
        const newDispute = new Dispute({
            transactionId,
            openedBy: cleanAuthUserId,
            category,
            description: description.trim(),
            evidenceInfo: typeof evidenceInfo === 'string' ? evidenceInfo.trim() : undefined,
            status: DisputeStatus.OPEN
        });
        await newDispute.save();
        const populatedDispute = await Dispute.findById(newDispute._id)
            .populate('transactionId', 'cropName quantity unit agreedPricePerUnit totalAgreedValue currency status')
            .populate('openedBy', 'fullName _id')
            .exec();

        // Notify respondent
        try {
            const respondentId = farmerIdStr === cleanAuthUserId ? dealerIdStr : farmerIdStr;
            const initiator = await User.findById(authUserId).select('fullName').exec();
            const initiatorName = initiator?.fullName || 'Partner';
            await createNotification({
                userId: respondentId,
                type: 'DISPUTE_RAISED',
                title: `Dispute Raised: ${transaction.cropName}`,
                body: `${initiatorName} opened a dispute for ${transaction.cropName} (${category}). Please review the claim in Transactions.`,
                link: '/transactions',
                meta: {
                    reminderKey: `tx_dispute_${transaction._id}`,
                    actionLabel: 'Review Dispute',
                    category: 'COMPLAINT',
                    priority: 'high',
                    disputeId: newDispute._id,
                    transactionId: transaction._id
                }
            });
        } catch (notifErr) {
            console.error('Failed to dispatch dispute notification:', notifErr);
        }

        res.status(201).json({
            success: true,
            message: 'Dispute case opened successfully. Your case is recorded privately in MavunoTrust.',
            data: populatedDispute
        });
    }
    catch (err) {
        next(err);
    }
};
/**
 * Get all disputes opened by the authenticated user
 */
export const getDisputes = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const disputes = await Dispute.find({ openedBy: getCleanId(authUserId) })
            .populate('transactionId', 'cropName quantity unit agreedPricePerUnit totalAgreedValue currency status')
            .populate('openedBy', 'fullName _id')
            .sort({ createdAt: -1 })
            .exec();
        res.json({ success: true, data: disputes });
    }
    catch (err) {
        next(err);
    }
};
/**
 * Get a specific dispute by ID or caseId
 */
export const getDisputeById = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { id } = req.params;
        // Search by _id or caseId
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const dispute = isObjectId
            ? await Dispute.findById(id).populate('transactionId').populate('openedBy', 'fullName _id').exec()
            : await Dispute.findOne({ caseId: id }).populate('transactionId').populate('openedBy', 'fullName _id').exec();
        if (!dispute) {
            res.status(404).json({ success: false, error: { message: 'Dispute case not found.' } });
            return;
        }
        if (getCleanId(dispute.openedBy) !== getCleanId(authUserId)) {
            res.status(403).json({ success: false, error: { message: 'Unauthorized access to dispute case.' } });
            return;
        }
        res.json({ success: true, data: dispute });
    }
    catch (err) {
        next(err);
    }
};
/**
 * Close an open dispute case
 */
export const closeDispute = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { id } = req.params;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const dispute = isObjectId
            ? await Dispute.findById(id)
            : await Dispute.findOne({ caseId: id });
        if (!dispute) {
            res.status(404).json({ success: false, error: { message: 'Dispute case not found.' } });
            return;
        }
        const cleanAuthUserId = getCleanId(authUserId);
        if (getCleanId(dispute.openedBy) !== cleanAuthUserId) {
            res.status(403).json({ success: false, error: { message: 'Unauthorized access to dispute case.' } });
            return;
        }
        // Idempotent check
        if (dispute.status === DisputeStatus.CLOSED) {
            const existingDispute = await Dispute.findById(dispute._id)
                .populate('transactionId', 'cropName quantity unit agreedPricePerUnit totalAgreedValue currency status')
                .populate('openedBy', 'fullName _id')
                .exec();
            res.json({
                success: true,
                message: 'Dispute case is already closed.',
                data: existingDispute
            });
            return;
        }
        dispute.status = DisputeStatus.CLOSED;
        dispute.closedAt = new Date();
        dispute.closedBy = cleanAuthUserId;
        await dispute.save();
        const updatedDispute = await Dispute.findById(dispute._id)
            .populate('transactionId', 'cropName quantity unit agreedPricePerUnit totalAgreedValue currency status')
            .populate('openedBy', 'fullName _id')
            .exec();
        res.json({
            success: true,
            message: 'Dispute case has been closed.',
            data: updatedDispute
        });
    }
    catch (err) {
        next(err);
    }
};
