import { Router } from 'express';
import { createOrGetConversation, getConversations, getConversationById, getMessages, sendMessage } from '../controllers/conversationController.js';
import { requireAuth } from '../middleware/requireAuth.js';
const router = Router();
// All routes require authentication
router.use(requireAuth);
router.post('/create', createOrGetConversation);
router.get('/', getConversations);
router.get('/:id', getConversationById);
router.get('/:id/messages', getMessages);
router.post('/:id/send', sendMessage);
export default router;
