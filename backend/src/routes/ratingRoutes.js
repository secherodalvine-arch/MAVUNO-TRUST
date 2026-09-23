import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { submitRating, getTransactionRatings } from '../controllers/ratingController.js';
const router = Router();
// All rating routes require authentication
router.use(requireAuth);
router.post('/', submitRating);
router.get('/transaction/:transactionId', getTransactionRatings);
export default router;
