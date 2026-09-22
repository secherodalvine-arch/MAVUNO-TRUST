import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { submitRating, getTransactionRatings } from '../controllers/ratingController';

const router = Router();

// All rating routes require authentication
router.use(requireAuth);

router.post('/', submitRating);
router.get('/transaction/:transactionId', getTransactionRatings);

export default router;
