import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { UserRole } from '../models/User';
import {
  createCropListing,
  getMyCropListings,
  getPublicCropListings,
  getCropListingById,
  updateCropListing,
  deleteCropListing,
} from '../controllers/cropListingController';

const router = Router();

// Public routes for browsing listings
router.get('/public', getPublicCropListings);
router.get('/:id', getCropListingById);

// Protected routes (Farmer only)
router.post('/', requireAuth, requireRole(UserRole.FARMER), createCropListing);
router.get('/my-listings/all', requireAuth, requireRole(UserRole.FARMER), getMyCropListings);
router.put('/:id', requireAuth, requireRole(UserRole.FARMER), updateCropListing);
router.delete('/:id', requireAuth, requireRole(UserRole.FARMER), deleteCropListing);

export default router;
