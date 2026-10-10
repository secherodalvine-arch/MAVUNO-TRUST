import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { UserRole } from '../models/User.js';
import {
    createDemand,
    getMyDemands,
    updateDemand,
    matchListingToDemands
} from '../controllers/demandController.js';

const router = express.Router();

// Dealer routes
router.post('/', requireAuth, requireRole(UserRole.DEALER), createDemand);
router.get('/me', requireAuth, requireRole(UserRole.DEALER), getMyDemands);
router.put('/:id', requireAuth, requireRole(UserRole.DEALER), updateDemand);

// Farmer match route
router.get('/match/:listingId', requireAuth, requireRole(UserRole.FARMER), matchListingToDemands);

export default router;
