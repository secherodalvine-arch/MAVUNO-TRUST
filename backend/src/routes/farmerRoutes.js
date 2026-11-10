import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRole } from '../models/User.js';
import {
    getMyFarmerProfile,
    updateMyFarmerProfile,
    getPublicFarmerProfile,
    getMyFarmLocation,
    updateMyFarmLocation,
    getMyFarmBoundary,
    updateMyFarmBoundary,
    clearMyFarmBoundary,
    getSatelliteStatus,
    getMyFarmNDVI,
    getMyFarmAdvisory,
    getAssistancePartners,
    requestAssistance,
    updatePushToken,
    getMyFarmWeather,
    getMyNDVIHistory,
} from '../controllers/farmerController.js';

const router = Router();

// Public farmer profile lookup (data minimization applied — strictly strips private GPS coordinates & farm boundary)
router.get('/public/:id', getPublicFarmerProfile);

// Authenticated farmer profile routes
router.get('/me', requireAuth, requireRole(UserRole.FARMER), getMyFarmerProfile);
router.put('/me', requireAuth, requireRole(UserRole.FARMER), updateMyFarmerProfile);

// Authenticated farmer private location & GPS coordinate endpoints
router.get('/location', requireAuth, requireRole(UserRole.FARMER), getMyFarmLocation);
router.put('/location', requireAuth, requireRole(UserRole.FARMER), updateMyFarmLocation);

// Authenticated farmer private farm boundary polygon endpoints
router.get('/boundary', requireAuth, requireRole(UserRole.FARMER), getMyFarmBoundary);
router.put('/boundary', requireAuth, requireRole(UserRole.FARMER), updateMyFarmBoundary);
router.delete('/boundary', requireAuth, requireRole(UserRole.FARMER), clearMyFarmBoundary);

// Authenticated farmer Sentinel-2 / Google Earth Engine satellite endpoints
router.get('/satellite/status', requireAuth, requireRole(UserRole.FARMER), getSatelliteStatus);
router.get('/satellite/ndvi', requireAuth, requireRole(UserRole.FARMER), getMyFarmNDVI);
router.get('/satellite/advisory', requireAuth, requireRole(UserRole.FARMER), getMyFarmAdvisory);
router.get('/satellite/history', requireAuth, requireRole(UserRole.FARMER), getMyNDVIHistory);

// Weather endpoint (Open-Meteo — free, no API key required)
router.get('/weather', requireAuth, requireRole(UserRole.FARMER), getMyFarmWeather);

// Authenticated farmer agricultural assistance & partner referral endpoints (One Acre Fund / Tupande)
router.get('/assistance/partners', requireAuth, requireRole(UserRole.FARMER), getAssistancePartners);
router.post('/assistance/referral', requireAuth, requireRole(UserRole.FARMER), requestAssistance);

// Authenticated farmer push notification token registration
router.post('/notifications/push-token', requireAuth, requireRole(UserRole.FARMER), updatePushToken);

export default router;
