import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getLatestMarketPrices, searchMarketPrices } from '../controllers/marketController';

const router = Router();

// Protected market reference endpoints (accessible to authenticated farmers)
router.get('/latest', requireAuth, getLatestMarketPrices);
router.get('/search', requireAuth, searchMarketPrices);
router.post('/search', requireAuth, searchMarketPrices);

export default router;
