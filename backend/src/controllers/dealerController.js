import * as dealerService from '../services/dealerService.js';
export const getMyDealerProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await dealerService.getDealerProfileByUserId(userId);
        res.json({ success: true, data: { profile } });
    }
    catch (err) {
        next(err);
    }
};
export const updateMyDealerProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await dealerService.updateDealerProfile(userId, req.body);
        res.json({ success: true, data: { profile } });
    }
    catch (err) {
        next(err);
    }
};
export const getPublicDealerProfile = async (req, res, next) => {
    try {
        const id = req.params.id;
        const profile = await dealerService.getPublicDealerProfile(id);
        res.json({ success: true, data: { profile } });
    }
    catch (err) {
        next(err);
    }
};
export const getVerifiedDealers = async (req, res, next) => {
    try {
        const profiles = await dealerService.getVerifiedDealers();
        res.json({ success: true, data: profiles });
    }
    catch (err) {
        next(err);
    }
};
