import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import farmerRoutes from './farmerRoutes.js';
import dealerRoutes from './dealerRoutes.js';
import adminRoutes from './adminRoutes.js';
import cropRoutes from './cropRoutes.js';
import verificationRoutes from './verificationRoutes.js';
import marketRoutes from './marketRoutes.js';
import productionCostRoutes from './productionCostRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import ratingRoutes from './ratingRoutes.js';
import disputeRoutes from './disputeRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import agentAdminRoutes from './agentAdminRoutes.js';
import aiRoutes from './aiRoutes.js';
import demandRoutes from './demandRoutes.js';
import { getMarketPrices } from '../controllers/marketDataController.js';

const router = Router();

// API routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/farmers', farmerRoutes);
router.use('/dealers', dealerRoutes);
router.use('/demands', demandRoutes);
router.use('/admin/agent', agentAdminRoutes);
router.use('/admin', adminRoutes);
router.use('/crops', cropRoutes);
router.use('/verifications', verificationRoutes);
router.use('/verification', verificationRoutes);
router.use('/ai', aiRoutes);
router.get('/market-prices', getMarketPrices);
router.use('/market', marketRoutes);
router.use('/production-costs', productionCostRoutes);
router.use('/chat', conversationRoutes);
router.use('/transactions', transactionRoutes);
router.use('/ratings', ratingRoutes);
router.use('/disputes', disputeRoutes);
router.use('/notifications', notificationRoutes);

export default router;
