import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { UserRole } from '../models/User';
import {
  getMyFarmerProfile,
  updateMyFarmerProfile,
  getPublicFarmerProfile,
} from '../controllers/farmerController';

const router = Router();

// Public farmer profile lookup (data minimization applied)
router.get('/public/:id', getPublicFarmerProfile);

// Authenticated farmer routes
router.get('/me', requireAuth, requireRole(UserRole.FARMER), getMyFarmerProfile);
router.put('/me', requireAuth, requireRole(UserRole.FARMER), updateMyFarmerProfile);

export default router;
