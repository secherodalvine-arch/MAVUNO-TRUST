import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Conversation, Message, MessageStatus } from '../models/Conversation';
import Offer from '../models/Offer';
import FarmerCropListing from '../models/FarmerCropListing';
import { getIO } from '../socket';

/**
 * createOrGetConversation
 * 
 * Creates a new conversation or retrieves an existing one for a specific offer.
 */
export const createOrGetConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
    const { targetUserId, offerId } = req.body;

    if (!authUserId) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
      return;
    }

    if (!targetUserId || !offerId) {
      res.status(400).json({ success: false, error: { message: 'Missing targetUserId or offerId.' } });
      return;
    }

    if (authUserId === targetUserId) {
      res.status(400).json({ success: false, error: { message: 'Cannot start a conversation with yourself.' } });
      return;
    }

    // Verify the offer exists
    const offer = await Offer.findById(offerId).exec();
    if (!offer) {
      res.status(404).json({ success: false, error: { message: 'Offer not found.' } });
      return;
    }

    // Verify that the authenticated user is involved in the offer
    if (offer.farmerId.toString() !== authUserId && offer.dealerId.toString() !== authUserId) {
      res.status(403).json({ success: false, error: { message: 'You are not a participant in this offer.' } });
      return;
    }

    // Verify that the target user is the OTHER participant in the offer
    if (offer.farmerId.toString() !== targetUserId && offer.dealerId.toString() !== targetUserId) {
      res.status(403).json({ success: false, error: { message: 'Target user is not a participant in this offer.' } });
      return;
    }

    // Retrieve the listing (for double checking ownership if needed, but offer check is sufficient)
    const listing = await FarmerCropListing.findById(offer.listingId).exec();
    if (!listing) {
      res.status(404).json({ success: false, error: { message: 'Related crop listing not found.' } });
      return;
    }

    // Check if conversation already exists for this offer and these participants
    let conversation = await Conversation.findOne({
      relatedOfferId: offerId,
      participants: { $all: [authUserId, targetUserId] }
    }).exec();

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [authUserId, targetUserId],
        relatedOfferId: offer._id,
        relatedListingId: listing._id,
        isActive: true
      });
      await conversation.save();
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

/**
 * getConversations
 * 
 * Retrieves all conversations for the authenticated user.
 */
export const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
    if (!authUserId) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
      return;
    }

    const conversations = await Conversation.find({ participants: authUserId })
      .populate('participants', 'fullName _id') // only fetch basic user info
      .populate('relatedListingId', 'cropName estimatedQuantity unit') // safe public fields
      .sort({ updatedAt: -1 })
      .exec();

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
};

/**
 * getMessages
 * 
 * Retrieves all messages for a specific conversation.
 * Enforces IDOR protection by ensuring the user is a participant.
 */
export const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
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

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .exec();

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

/**
 * sendMessage
 * 
 * Sends a message in a conversation.
 * Validates the conversation exists and the user is a participant.
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
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

    // Update conversation lastMessageAt
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Broadcast the message to the conversation room via WebSocket
    try {
      getIO().to(conversationId).emit('new_message', message);
    } catch (wsErr) {
      console.error('Failed to emit websocket message:', wsErr);
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};
