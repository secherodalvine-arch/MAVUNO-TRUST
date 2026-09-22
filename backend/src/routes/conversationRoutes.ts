import { Router } from 'express';
import { createOrGetConversation, getConversations, getMessages, sendMessage } from '../controllers/conversationController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.post('/create', createOrGetConversation);
router.get('/', getConversations);
router.get('/:id/messages', getMessages);
router.post('/:id/send', sendMessage);

export default router;
