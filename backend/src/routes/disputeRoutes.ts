import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { createDispute, getDisputes, getDisputeById, closeDispute } from '../controllers/disputeController';

const router = Router();

// Protect all dispute routes
router.use(requireAuth);

router.post('/', createDispute);
router.get('/', getDisputes);
router.get('/:id', getDisputeById);
router.post('/:id/close', closeDispute);

export default router;
