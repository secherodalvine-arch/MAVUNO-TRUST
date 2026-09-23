/**
 * Conversation + Message Models
 *
 * Private bidirectional communication between a farmer and a dealer.
 *
 * PRIVACY RULES:
 *  1. Messages are strictly PRIVATE between the two participants.
 *  2. Messages must NEVER appear in public-facing API responses.
 *  3. Authorization must verify: only conversation participants can read messages.
 *  4. If exact location is ever shared in a message, it must be through
 *     the consent-controlled private location mechanism — not free text.
 *  5. Conversation recording is NOT implemented. If recording is added
 *     later, it must require EXPLICIT user consent — not silent capture.
 *  6. Message content is not currently encrypted at rest in this MVP.
 *     Encryption at rest should be evaluated for a production deployment.
 */
import mongoose, { Schema } from 'mongoose';
const ConversationSchema = new Schema({
    participants: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        required: true,
        validate: {
            validator: (v) => v.length === 2,
            message: 'A conversation must have exactly 2 participants',
        },
    },
    relatedListingId: {
        type: Schema.Types.ObjectId,
        ref: 'FarmerCropListing',
    },
    relatedOfferId: {
        type: Schema.Types.ObjectId,
        ref: 'Offer',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastMessageAt: { type: Date },
    lastMessageText: { type: String, trim: true },
    lastMessageSenderId: { type: Schema.Types.ObjectId, ref: 'User' },
    lastMessageStatus: { type: String, default: 'SENT' },
}, { timestamps: true });
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
const Conversation = mongoose.model('Conversation', ConversationSchema);
// ── Message ───────────────────────────────────────────────────────────────────
export var MessageStatus;
(function (MessageStatus) {
    MessageStatus["SENT"] = "SENT";
    MessageStatus["DELIVERED"] = "DELIVERED";
    MessageStatus["READ"] = "READ";
})(MessageStatus || (MessageStatus = {}));
const MessageSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: [true, 'Conversation reference is required'],
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender reference is required'],
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [5000, 'Message must not exceed 5000 characters'],
    },
    status: {
        type: String,
        enum: Object.values(MessageStatus),
        default: MessageStatus.SENT,
    },
    attachmentRef: { type: String, trim: true },
    isSystemMessage: { type: Boolean, default: false },
    deletedBySender: { type: Boolean, default: false },
    deletedByRecipient: { type: Boolean, default: false },
}, { timestamps: true });
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1 });
const Message = mongoose.model('Message', MessageSchema);
export { Conversation, Message };
