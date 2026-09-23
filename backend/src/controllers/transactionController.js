import Transaction, { TransactionStatus, FulfilmentStatus, CancellationReason } from '../models/Transaction.js';
import User from '../models/User.js';
import { createNotification } from '../models/Notification.js';
/**
 * Get all transactions for the authenticated user
 * Enforces IDOR protection by only returning transactions where the user is either the farmer or the dealer.
 */
export const getTransactions = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const transactions = await Transaction.find({
            $or: [{ farmerId: authUserId }, { dealerId: authUserId }]
        })
            .populate('farmerId', 'fullName _id')
            .populate('dealerId', 'fullName _id')
            .sort({ createdAt: -1 })
            .exec();
        res.json({ success: true, data: transactions });
    }
    catch (err) {
        next(err);
    }
};
/**
 * Get a specific transaction by ID
 * Enforces IDOR protection by verifying the authenticated user is a participant.
 */
export const getTransactionById = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { id } = req.params;
        const transaction = await Transaction.findById(id)
            .populate('farmerId', 'fullName _id')
            .populate('dealerId', 'fullName _id')
            .exec();
        if (!transaction) {
            res.status(404).json({ success: false, error: { message: 'Transaction not found.' } });
            return;
        }
        if (transaction.farmerId._id.toString() !== authUserId && transaction.dealerId._id.toString() !== authUserId) {
            res.status(403).json({ success: false, error: { message: 'Unauthorized access to transaction.' } });
            return;
        }
        res.json({ success: true, data: transaction });
    }
    catch (err) {
        next(err);
    }
};
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
 * Update fulfilment information for a specific transaction
 * Enforces IDOR protection by verifying the authenticated user is a participant.
 */
export const updateFulfilment = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { id } = req.params;
        const { status, expectedDate, method, notes, actualFulfilmentDate } = req.body;
        const transaction = await Transaction.findById(id);
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
        if (status && !Object.values(FulfilmentStatus).includes(status)) {
            res.status(400).json({ success: false, error: { message: `Invalid fulfilment status. Must be one of: ${Object.values(FulfilmentStatus).join(', ')}` } });
            return;
        }
        if (!transaction.fulfilment) {
            transaction.fulfilment = {
                status: FulfilmentStatus.PENDING
            };
        }
        if (status) {
            transaction.fulfilment.status = status;
            if (status === FulfilmentStatus.FULFILLED && !actualFulfilmentDate && !transaction.fulfilment.actualFulfilmentDate) {
                transaction.fulfilment.actualFulfilmentDate = new Date();
            }
        }
        if (expectedDate !== undefined) {
            transaction.fulfilment.expectedDate = expectedDate ? new Date(expectedDate) : undefined;
        }
        if (method !== undefined) {
            transaction.fulfilment.method = typeof method === 'string' ? method.trim() : method;
        }
        if (notes !== undefined) {
            transaction.fulfilment.notes = typeof notes === 'string' ? notes.trim() : notes;
        }
        if (actualFulfilmentDate !== undefined) {
            transaction.fulfilment.actualFulfilmentDate = actualFulfilmentDate ? new Date(actualFulfilmentDate) : undefined;
        }
        transaction.fulfilment.lastUpdatedBy = authUserId;
        transaction.fulfilment.lastUpdatedAt = new Date();
        // Transition AGREED -> IN_PROGRESS
        if (transaction.status === TransactionStatus.AGREED) {
            transaction.status = TransactionStatus.IN_PROGRESS;
        }
        await transaction.save();
        const updatedTransaction = await Transaction.findById(id)
            .populate('farmerId', 'fullName _id')
            .populate('dealerId', 'fullName _id')
            .exec();

        // Notify counterparty of fulfilment update
        try {
            const otherUserId = farmerIdStr === cleanAuthUserId ? dealerIdStr : farmerIdStr;
            const updater = await User.findById(authUserId).select('fullName').exec();
            const updaterName = updater?.fullName || 'Partner';
            await createNotification({
                userId: otherUserId,
                type: 'GENERAL',
                title: 'Transaction Fulfilment Updated',
                body: `${updaterName} updated fulfilment for ${transaction.cropName} to ${transaction.fulfilment.status}.`,
                link: '/transactions',
                meta: { transactionId: transaction._id, status: transaction.fulfilment.status }
            });
        } catch (notifErr) {
            console.error('Failed to dispatch fulfilment notification:', notifErr);
        }

        res.json({ success: true, data: updatedTransaction });
    }
    catch (err) {
        next(err);
    }
};
/**
 * Explicitly complete a transaction
 * Requires:
 * 1. Authenticated user must be participant (farmer or dealer).
 * 2. Transaction status must NOT already be COMPLETED (idempotent check).
 * 3. Transaction status must be IN_PROGRESS.
 * 4. Fulfilment status must be FULFILLED.
 */
export const completeTransaction = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { id } = req.params;
        const transaction = await Transaction.findById(id);
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
        // Idempotency check: Already completed
        if (transaction.status === TransactionStatus.COMPLETED) {
            const existingTx = await Transaction.findById(id)
                .populate('farmerId', 'fullName _id')
                .populate('dealerId', 'fullName _id')
                .exec();
            res.json({
                success: true,
                message: 'Transaction is already completed.',
                data: existingTx
            });
            return;
        }
        // Eligibility checks: Must be IN_PROGRESS and FULFILLED
        if (transaction.status !== TransactionStatus.IN_PROGRESS ||
            !transaction.fulfilment ||
            transaction.fulfilment.status !== FulfilmentStatus.FULFILLED) {
            res.status(400).json({
                success: false,
                error: { message: 'Transaction must be fulfilled before it can be completed.' }
            });
            return;
        }
        // Server determines completion timestamp & actor
        transaction.status = TransactionStatus.COMPLETED;
        transaction.completedAt = new Date();
        transaction.completedBy = cleanAuthUserId;
        await transaction.save();
        const updatedTransaction = await Transaction.findById(id)
            .populate('farmerId', 'fullName _id')
            .populate('dealerId', 'fullName _id')
            .exec();

        // Notify counterparty that transaction is completed
        try {
            const otherUserId = farmerIdStr === cleanAuthUserId ? dealerIdStr : farmerIdStr;
            const actor = await User.findById(authUserId).select('fullName').exec();
            const actorName = actor?.fullName || 'Partner';
            await createNotification({
                userId: otherUserId,
                type: 'TRANSACTION_COMPLETED',
                title: 'Transaction Successfully Completed! 🎉',
                body: `${actorName} confirmed delivery & payment completion for ${transaction.cropName}. Please take a moment to leave a partner rating.`,
                link: '/transactions',
                meta: { transactionId: transaction._id }
            });
        } catch (notifErr) {
            console.error('Failed to dispatch transaction completed notification:', notifErr);
        }

        res.json({
            success: true,
            message: 'Transaction has been explicitly marked as completed.',
            data: updatedTransaction
        });
    }
    catch (err) {
        next(err);
    }
};
/**
 * Explicitly cancel a transaction
 * Requires:
 * 1. Authenticated user must be participant (farmer or dealer).
 * 2. Transaction status must NOT be COMPLETED (returns 400 Bad Request).
 * 3. Fulfilment status must NOT be FULFILLED (returns 400 Bad Request directing to dispute/remedy process).
 * 4. Transaction status must be AGREED or IN_PROGRESS.
 * 5. If transaction is already CANCELLED, returns 200 OK without overwriting original cancellation fields (idempotent).
 * 6. Requires a valid cancellationReason.
 */
export const cancelTransaction = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const { id } = req.params;
        const { cancellationReason, cancellationNote } = req.body;
        const transaction = await Transaction.findById(id);
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
        // Check 1: Already cancelled (Idempotent response)
        if (transaction.status === TransactionStatus.CANCELLED) {
            const existingTx = await Transaction.findById(id)
                .populate('farmerId', 'fullName _id')
                .populate('dealerId', 'fullName _id')
                .exec();
            res.json({
                success: true,
                message: 'Transaction is already cancelled.',
                data: existingTx
            });
            return;
        }
        // Check 2: Cannot cancel completed transaction
        if (transaction.status === TransactionStatus.COMPLETED) {
            res.status(400).json({
                success: false,
                error: { message: 'Completed transactions cannot be cancelled.' }
            });
            return;
        }
        // Check 3: Cannot directly cancel fulfilled transaction
        if (transaction.fulfilment && transaction.fulfilment.status === FulfilmentStatus.FULFILLED) {
            res.status(400).json({
                success: false,
                error: { message: 'Transactions with fulfilled delivery/collection cannot be directly cancelled. Please use the dispute/remedy process if an issue has occurred after fulfilment.' }
            });
            return;
        }
        // Check 4: Must be AGREED or IN_PROGRESS
        if (transaction.status !== TransactionStatus.AGREED && transaction.status !== TransactionStatus.IN_PROGRESS) {
            res.status(400).json({
                success: false,
                error: { message: `Transaction in status ${transaction.status} cannot be cancelled.` }
            });
            return;
        }
        // Check 5: Validate cancellationReason
        if (!cancellationReason || !Object.values(CancellationReason).includes(cancellationReason)) {
            res.status(400).json({
                success: false,
                error: { message: `Cancellation reason is required and must be one of: ${Object.values(CancellationReason).join(', ')}.` }
            });
            return;
        }
        // Server-side audit fields
        transaction.status = TransactionStatus.CANCELLED;
        transaction.cancelledAt = new Date();
        transaction.cancelledBy = cleanAuthUserId;
        transaction.cancellationReason = cancellationReason;
        transaction.cancellationNote = typeof cancellationNote === 'string' ? cancellationNote.trim() : undefined;
        await transaction.save();
        const updatedTransaction = await Transaction.findById(id)
            .populate('farmerId', 'fullName _id')
            .populate('dealerId', 'fullName _id')
            .exec();

        // Notify counterparty of cancellation
        try {
            const otherUserId = farmerIdStr === cleanAuthUserId ? dealerIdStr : farmerIdStr;
            const actor = await User.findById(authUserId).select('fullName').exec();
            const actorName = actor?.fullName || 'Partner';
            await createNotification({
                userId: otherUserId,
                type: 'GENERAL',
                title: 'Transaction Cancelled',
                body: `${actorName} cancelled the transaction for ${transaction.cropName} (Reason: ${cancellationReason}).`,
                link: '/transactions',
                meta: { transactionId: transaction._id, cancellationReason }
            });
        } catch (notifErr) {
            console.error('Failed to dispatch transaction cancellation notification:', notifErr);
        }

        res.json({
            success: true,
            message: 'Transaction has been explicitly cancelled.',
            data: updatedTransaction
        });
    }
    catch (err) {
        next(err);
    }
};
