import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getTransactions, getTransactionById, updateFulfilment, completeTransaction, cancelTransaction } from '../controllers/transactionController';

const router = Router();

// Protect all transaction routes
router.use(requireAuth);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.patch('/:id/fulfilment', updateFulfilment);
router.post('/:id/complete', completeTransaction);
router.post('/:id/cancel', cancelTransaction);

export default router;


