import * as demandService from '../services/demandService.js';
import { catchAsync } from '../utils/errorHandlers.js';

export const createDemand = catchAsync(async (req, res) => {
    const demand = await demandService.createDemand(req.user.id, req.body);
    res.status(201).json({ success: true, data: demand });
});

export const getMyDemands = catchAsync(async (req, res) => {
    const demands = await demandService.getMyDemands(req.user.id);
    res.status(200).json({ success: true, count: demands.length, data: demands });
});

export const updateDemand = catchAsync(async (req, res) => {
    const demand = await demandService.updateDemand(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: demand });
});

export const matchListingToDemands = catchAsync(async (req, res) => {
    const matchResults = await demandService.matchFarmerListingToDemands(req.params.listingId);
    res.status(200).json({ success: true, data: matchResults });
});
