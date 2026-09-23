import * as farmerService from '../services/farmerService.js';
export const getMyFarmerProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await farmerService.getFarmerProfileByUserId(userId);
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
