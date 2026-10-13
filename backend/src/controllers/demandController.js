import * as demandService from '../services/demandService.js';

export const createDemand = async (req, res, next) => {
    try {
        const userId = req.user.userId || req.user.id;
        const demand = await demandService.createDemand(userId, req.body);
        res.status(201).json({ success: true, data: demand });
    } catch (err) {
        next(err);
    }
};

export const getMyDemands = async (req, res, next) => {
    try {
        const userId = req.user.userId || req.user.id;
        const demands = await demandService.getMyDemands(userId);
        res.status(200).json({ success: true, count: demands.length, data: demands });
    } catch (err) {
        next(err);
    }
};

export const updateDemand = async (req, res, next) => {
    try {
        const userId = req.user.userId || req.user.id;
        const demand = await demandService.updateDemand(userId, req.params.id, req.body);
        res.status(200).json({ success: true, data: demand });
    } catch (err) {
        next(err);
    }
};

export const matchListingToDemands = async (req, res, next) => {
    try {
        const userId = req.user.userId || req.user.id;
        const matchResults = await demandService.matchFarmerListingToDemands(req.params.listingId, userId);
        res.status(200).json({ success: true, data: matchResults });
    } catch (err) {
        next(err);
    }
};
