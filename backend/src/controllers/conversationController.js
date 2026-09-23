import { Conversation, Message, MessageStatus } from '../models/Conversation.js';
import Offer from '../models/Offer.js';
import FarmerCropListing from '../models/FarmerCropListing.js';
import User from '../models/User.js';
import DealerProfile from '../models/DealerProfile.js';
import FarmerProfile from '../models/FarmerProfile.js';
import { getIO } from '../socket.js';
import mongoose from 'mongoose';
import { createNotification } from '../models/Notification.js';

/**
 * createOrGetConversation
 *
 * Creates a new conversation or retrieves an existing one between two users.
 * Supports both direct messaging (without offerId) and offer-linked negotiation rooms.
 */
export const createOrGetConversation = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        const { targetUserId, offerId } = req.body;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        if (!targetUserId) {
            res.status(400).json({ success: false, error: { message: 'Missing targetUserId.' } });
            return;
        }

        // Resolve target user if targetUserId happens to be a Profile ID
        let resolvedTargetId = targetUserId;
        const isValidId = mongoose.Types.ObjectId.isValid(targetUserId);
        if (!isValidId) {
            res.status(400).json({ success: false, error: { message: 'Invalid target user ID.' } });
            return;
        }

        const userExists = await User.findById(targetUserId).select('_id fullName').exec();
        if (!userExists) {
            // Check if it's a dealer profile ID
            const dealerProfile = await DealerProfile.findById(targetUserId).select('userId').exec();
            if (dealerProfile?.userId) {
                resolvedTargetId = dealerProfile.userId.toString();
            } else {
                const farmerProfile = await FarmerProfile.findById(targetUserId).select('userId').exec();
                if (farmerProfile?.userId) {
                    resolvedTargetId = farmerProfile.userId.toString();
                } else {
                    res.status(404).json({ success: false, error: { message: 'Target user not found.' } });
                    return;
                }
            }
        }

        if (authUserId === resolvedTargetId.toString()) {
            res.status(400).json({ success: false, error: { message: 'Cannot start a conversation with yourself.' } });
            return;
        }

        // Case 1: Linked to a specific offer
        if (offerId) {
            const offer = await Offer.findById(offerId).exec();
            if (!offer) {
                res.status(404).json({ success: false, error: { message: 'Offer not found.' } });
                return;
            }
            if (offer.farmerId.toString() !== authUserId && offer.dealerId.toString() !== authUserId) {
                res.status(403).json({ success: false, error: { message: 'You are not a participant in this offer.' } });
                return;
            }
            if (offer.farmerId.toString() !== resolvedTargetId.toString() && offer.dealerId.toString() !== resolvedTargetId.toString()) {
                res.status(403).json({ success: false, error: { message: 'Target user is not a participant in this offer.' } });
                return;
            }
            const listing = await FarmerCropListing.findById(offer.listingId).exec();

            let conversation = await Conversation.findOne({
                relatedOfferId: offerId,
                participants: { $all: [authUserId, resolvedTargetId] }
            })
            .populate('participants', 'fullName _id')
            .populate('relatedListingId', 'cropName estimatedQuantity unit')
            .exec();

            if (!conversation) {
                conversation = new Conversation({
                    participants: [authUserId, resolvedTargetId],
                    relatedOfferId: offer._id,
                    relatedListingId: listing?._id,
                    isActive: true
                });
                await conversation.save();
                conversation = await Conversation.findById(conversation._id)
                    .populate('participants', 'fullName _id')
                    .populate('relatedListingId', 'cropName estimatedQuantity unit')
                    .exec();
            }
            res.status(200).json({ success: true, data: conversation });
            return;
        }

        // Case 2: Direct conversation between users (e.g. from Verified Dealers directory)
        let conversation = await Conversation.findOne({
            participants: { $all: [authUserId, resolvedTargetId] }
        })
        .sort({ updatedAt: -1 })
        .populate('participants', 'fullName _id')
        .populate('relatedListingId', 'cropName estimatedQuantity unit')
        .exec();

        if (!conversation) {
            conversation = new Conversation({
                participants: [authUserId, resolvedTargetId],
                isActive: true
            });
            await conversation.save();
            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'fullName _id')
                .populate('relatedListingId', 'cropName estimatedQuantity unit')
                .exec();
        }

        res.status(200).json({ success: true, data: conversation });
    }
    catch (err) {
        next(err);
    }
};

/**
 * getConversationById
 *
 * Retrieves a single conversation by ID with populated participant details.
 */
export const getConversationById = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        const { id } = req.params;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: { message: 'Invalid conversation ID.' } });
            return;
        }
        const conversation = await Conversation.findById(id)
            .populate('participants', 'fullName _id')
            .populate('relatedListingId', 'cropName estimatedQuantity unit')
            .exec();
        if (!conversation) {
            res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
            return;
        }
        const isParticipant = conversation.participants.some(p => p._id.toString() === authUserId);
        if (!isParticipant) {
            res.status(403).json({ success: false, error: { message: 'You are not a participant in this conversation.' } });
            return;
        }
        res.status(200).json({ success: true, data: conversation });
    }
    catch (err) {
        next(err);
    }
};
/**
 * getConversations
 *
 * Retrieves all conversations for the authenticated user.
 */
export const getConversations = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const rawConversations = await Conversation.find({ participants: authUserId })
            .populate('participants', 'fullName _id') // only fetch basic user info
            .populate('relatedListingId', 'cropName estimatedQuantity unit') // safe public fields
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .lean()
            .exec();

        // Ensure every conversation object has lastMessageText, lastMessageSenderId, and lastMessageStatus
        const conversations = await Promise.all(rawConversations.map(async (c) => {
            if (!c.lastMessageText) {
                const latestMsg = await Message.findOne({ conversationId: c._id })
                    .sort({ createdAt: -1 })
                    .select('content senderId createdAt status')
                    .lean();
                if (latestMsg) {
                    c.lastMessageText = latestMsg.content;
                    c.lastMessageSenderId = latestMsg.senderId?.toString();
                    c.lastMessageAt = latestMsg.createdAt;
                    c.lastMessageStatus = latestMsg.status;
                }
            }
            return c;
        }));

        res.status(200).json({ success: true, data: conversations });
    }
    catch (err) {
        next(err);
    }
};

/**
 * getMessages
 *
 * Retrieves all messages for a specific conversation.
 * Enforces IDOR protection by ensuring the user is a participant.
 * Marks unread incoming messages as READ and notifies sender.
 */
export const getMessages = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        const { id: conversationId } = req.params;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        const conversation = await Conversation.findById(conversationId).exec();
        if (!conversation) {
            res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
            return;
        }
        // IDOR Check
        const isParticipant = conversation.participants.some(p => p.toString() === authUserId);
        if (!isParticipant) {
            res.status(403).json({ success: false, error: { message: 'You are not a participant in this conversation.' } });
            return;
        }

        // Mark incoming messages as READ
        const updateResult = await Message.updateMany(
            { conversationId, senderId: { $ne: authUserId }, status: { $ne: MessageStatus.READ } },
            { $set: { status: MessageStatus.READ } }
        );

        if (updateResult.modifiedCount > 0) {
            conversation.lastMessageStatus = MessageStatus.READ;
            await conversation.save().catch(() => {});

            // Broadcast read receipt via WebSocket
            try {
                getIO().to(conversationId).emit('messages_read', {
                    conversationId,
                    readerId: authUserId
                });
            } catch (wsErr) {
                // Ignore socket emission errors if not connected
            }
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .exec();
        res.status(200).json({ success: true, data: messages });
    }
    catch (err) {
        next(err);
    }
};

/**
 * sendMessage
 *
 * Sends a message in a conversation.
 * Validates the conversation exists and the user is a participant.
 */
export const sendMessage = async (req, res, next) => {
    try {
        const authUserId = req.user?.userId;
        const { id: conversationId } = req.params;
        const { content } = req.body;
        if (!authUserId) {
            res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
            return;
        }
        if (!content || !content.trim()) {
            res.status(400).json({ success: false, error: { message: 'Message content cannot be empty.' } });
            return;
        }
        const conversation = await Conversation.findById(conversationId).exec();
        if (!conversation) {
            res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
            return;
        }
        // IDOR Check
        const isParticipant = conversation.participants.some(p => p.toString() === authUserId);
        if (!isParticipant) {
            res.status(403).json({ success: false, error: { message: 'You are not a participant in this conversation.' } });
            return;
        }
        const message = new Message({
            conversationId: conversation._id,
            senderId: authUserId,
            content: content.trim(),
            status: MessageStatus.SENT
        });
        await message.save();

        // Update conversation lastMessageAt & snippet
        conversation.lastMessageAt = new Date();
        conversation.lastMessageText = content.trim();
        conversation.lastMessageSenderId = authUserId;
        conversation.lastMessageStatus = MessageStatus.SENT;
        await conversation.save();
        // Broadcast the message to the conversation room via WebSocket
        try {
            getIO().to(conversationId).emit('new_message', message);
        }
        catch (wsErr) {
            console.error('Failed to emit websocket message:', wsErr);
        }

        // Notify counterparty
        try {
            const recipientId = conversation.participants.find(p => p.toString() !== authUserId);
            if (recipientId) {
                const sender = await User.findById(authUserId).select('fullName').exec();
                const senderName = sender?.fullName || 'User';
                const preview = content.trim().length > 70 ? content.trim().slice(0, 67) + '...' : content.trim();
                await createNotification({
                    userId: recipientId,
                    type: 'MESSAGE_RECEIVED',
                    title: `Message from ${senderName}`,
                    body: preview,
                    link: `/messages?conversationId=${conversation._id}`,
                    meta: { conversationId: conversation._id, senderId: authUserId }
                });
            }
        } catch (notifErr) {
            console.error('Failed to dispatch message notification:', notifErr);
        }

        res.status(201).json({ success: true, data: message });
    }
    catch (err) {
        next(err);
    }
};
