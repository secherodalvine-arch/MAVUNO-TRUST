import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRole } from '../models/User.js';
import { getMarketRecommendation } from '../controllers/aiController.js';

const router = Router();

// Only farmers should be requesting market recommendations
router.post(
  '/market-recommendation',
  requireAuth,
  requireRole(UserRole.FARMER),
  getMarketRecommendation
);

export default router;
