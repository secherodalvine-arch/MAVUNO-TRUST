import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import farmerRoutes from './farmerRoutes';
import dealerRoutes from './dealerRoutes';
import adminRoutes from './adminRoutes';
import cropRoutes from './cropRoutes';
import verificationRoutes from './verificationRoutes';
import marketRoutes from './marketRoutes';
import productionCostRoutes from './productionCostRoutes';
import conversationRoutes from './conversationRoutes';
import transactionRoutes from './transactionRoutes';
import ratingRoutes from './ratingRoutes';
import disputeRoutes from './disputeRoutes';

const router = Router();

// API routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/farmers', farmerRoutes);
router.use('/dealers', dealerRoutes);
router.use('/admin', adminRoutes);
router.use('/crops', cropRoutes);
router.use('/verifications', verificationRoutes);
router.use('/verification', verificationRoutes);
router.use('/market', marketRoutes);
router.use('/production-costs', productionCostRoutes);
router.use('/chat', conversationRoutes);
router.use('/transactions', transactionRoutes);
router.use('/ratings', ratingRoutes);
router.use('/disputes', disputeRoutes);

// Future API routes (placeholders, not implemented yet)
// router.use('/crops', cropRoutes);
// router.use('/market', marketRoutes);
// router.use('/verification', verificationRoutes);
// router.use('/matching', matchingRoutes);
// router.use('/offers', offerRoutes);
// router.use('/transactions', transactionRoutes);
// router.use('/rights', rightsRoutes);
// router.use('/complaints', complaintRoutes);

export default router;
