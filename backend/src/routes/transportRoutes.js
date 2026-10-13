import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRole } from '../models/User.js';
import {
  calculateRoute,
  getTransportEstimate,
  submitTransportRecord,
  getMyTransportRecords,
  updateMyTransportRecord,
  appealTransportRecord,
  getComparableRecords,
  getAdminFlaggedRecords,
  adminReviewRecord,
} from '../controllers/transportController.js';

const router = Router();

// ── Routing & Estimation ──
router.post('/route', requireAuth, calculateRoute);
router.post('/estimate', requireAuth, getTransportEstimate);
router.get('/comparables', requireAuth, getComparableRecords);

// ── Contributor Records (Farmer & Dealer) ──
router.post(
  '/records',
  requireAuth,
  requireRole(UserRole.FARMER, UserRole.DEALER),
  submitTransportRecord
);
router.get('/records/my', requireAuth, getMyTransportRecords);
router.patch('/records/:id', requireAuth, updateMyTransportRecord);
router.post('/records/:id/appeal', requireAuth, appealTransportRecord);

// ── Admin Moderation & Anti-Manipulation Review ──
router.get(
  '/admin/flagged',
  requireAuth,
  requireRole(UserRole.ADMIN),
  getAdminFlaggedRecords
);
router.patch(
  '/admin/records/:id/review',
  requireAuth,
  requireRole(UserRole.ADMIN),
  adminReviewRecord
);

export default router;
