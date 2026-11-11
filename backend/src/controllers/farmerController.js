import * as farmerService from '../services/farmerService.js';
import * as satelliteService from '../services/satelliteService.js';
import { getFarmWeather } from '../services/weatherService.js';
import FarmObservation from '../models/FarmObservation.js';

export const getMyFarmerProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await farmerService.getFarmerProfileByUserId(userId, true);
        res.json({ success: true, data: { profile } });
    }
    catch (err) {
        next(err);
    }
};

export const updateMyFarmerProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await farmerService.updateFarmerProfile(userId, req.body);
        res.json({ success: true, data: { profile } });
    }
    catch (err) {
        next(err);
    }
};

export const getMyFarmLocation = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const location = await farmerService.getFarmerLocation(userId);
        res.json({ success: true, data: { location } });
    }
    catch (err) {
        next(err);
    }
};

export const updateMyFarmLocation = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const location = await farmerService.updateFarmerLocation(userId, req.body);
        res.json({
            success: true,
            message: 'Farm location and coordinates updated successfully.',
            data: { location },
        });
    }
    catch (err) {
        next(err);
    }
};

export const getMyFarmBoundary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const boundary = await farmerService.getFarmerBoundary(userId);
        res.json({ success: true, data: { boundary } });
    }
    catch (err) {
        next(err);
    }
};

export const updateMyFarmBoundary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const boundary = await farmerService.updateFarmerBoundary(userId, req.body);
        res.json({
            success: true,
            message: 'Farm boundary polygon registered successfully.',
            data: { boundary },
        });
    }
    catch (err) {
        next(err);
    }
};

export const clearMyFarmBoundary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await farmerService.clearFarmerBoundary(userId);
        res.json({
            success: true,
            message: 'Farm boundary polygon removed successfully.',
            data: { boundary: result },
        });
    }
    catch (err) {
        next(err);
    }
};

export const getSatelliteStatus = async (req, res, next) => {
    try {
        const status = await satelliteService.getSatelliteServiceStatus();
        res.json({ success: true, data: status });
    }
    catch (err) {
        next(err);
    }
};

export const getMyFarmNDVI = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const boundaryData = await farmerService.getFarmerBoundary(userId);

        if (!boundaryData.hasBoundary || !boundaryData.farmBoundary) {
            return res.status(400).json({
                success: false,
                code: 'BOUNDARY_REQUIRED',
                message: 'No farm boundary registered. Please draw and save your farm boundary polygon first.',
            });
        }

        const maxCloud = req.query.maxCloudCover ? Number(req.query.maxCloudCover) : 20;
        const result = await satelliteService.calculateFarmNDVI({
            farmBoundary: boundaryData.farmBoundary,
            maxCloudCoverPercent: maxCloud,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        });

        if (!result.success) {
            return res.status(result.code === 'GEE_CREDENTIALS_REQUIRED' ? 503 : 500).json(result);
        }

        res.json({ success: true, data: result.data });
    }
    catch (err) {
        next(err);
    }
};

export const getPublicFarmerProfile = async (req, res, next) => {
    try {
        const id = req.params.id;
        const profile = await farmerService.getPublicFarmerProfile(id);
        res.json({ success: true, data: { profile } });
    }
    catch (err) {
        next(err);
    }
};

export const getMyFarmAdvisory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const advisory = await farmerService.getFarmerAdvisory(userId, req.query);
        res.json({ success: true, data: advisory });
    }
    catch (err) {
        if (err.code === 'BOUNDARY_REQUIRED') {
            return res.status(400).json({
                success: false,
                code: 'BOUNDARY_REQUIRED',
                message: err.message,
            });
        }
        next(err);
    }
};

export const getAssistancePartners = async (req, res, next) => {
    try {
        const partners = farmerService.getAssistancePartners();
        res.json({ success: true, data: { partners } });
    }
    catch (err) {
        next(err);
    }
};

export const requestAssistance = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const ipAddress = req.ip || req.connection?.remoteAddress || '';
        const referral = await farmerService.submitAssistanceReferral(userId, req.body, ipAddress);
        res.json({
            success: true,
            message: 'Agricultural assistance referral submitted successfully.',
            data: referral,
        });
    }
    catch (err) {
        if (err.code === 'EXPLICIT_CONSENT_REQUIRED') {
            return res.status(400).json({
                success: false,
                code: 'EXPLICIT_CONSENT_REQUIRED',
                message: err.message,
            });
        }
        next(err);
    }
};

export const updatePushToken = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await farmerService.updatePushToken(userId, req.body.fcmToken);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
};

export const getMyFarmWeather = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await farmerService.getFarmerProfileByUserId(userId, true);
        const weather = await getFarmWeather({
            latitude: profile.latitude,
            longitude: profile.longitude,
        });

        // Enrich with human-readable location from farmer profile
        const locationParts = [profile.generalArea, profile.subCounty, profile.county].filter(Boolean);
        const locationName = locationParts.length > 0 
            ? locationParts.join(', ') 
            : (profile.latitude !== undefined && profile.latitude !== null
                ? `${profile.latitude.toFixed(2)}°, ${profile.longitude.toFixed(2)}°`
                : 'Registered Farm');

        res.json({
            success: true,
            data: {
                ...weather,
                locationName,
                county: profile.county || '',
                subCounty: profile.subCounty || '',
                generalArea: profile.generalArea || '',
            },
        });
    }
    catch (err) {
        next(err);
    }
};

export const getMyNDVIHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const limit = Math.min(parseInt(req.query.limit) || 30, 100);
        const observations = await FarmObservation.find({ userId })
            .sort({ observationDate: -1 })
            .limit(limit)
            .select('observationDate meanNDVI minNDVI maxNDVI vegetationLabel vegetationSeverity cloudCoverPercent farmAreaAcres createdAt');
        res.json({ success: true, data: { observations, count: observations.length } });
    }
    catch (err) {
        next(err);
    }
};
