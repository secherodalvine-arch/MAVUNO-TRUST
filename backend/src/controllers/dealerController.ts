import { Request, Response, NextFunction } from 'express';
import * as dealerService from '../services/dealerService';

export const getMyDealerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const profile = await dealerService.getDealerProfileByUserId(userId);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

export const updateMyDealerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const profile = await dealerService.updateDealerProfile(userId, req.body);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

export const getPublicDealerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const profile = await dealerService.getPublicDealerProfile(id);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

export const getVerifiedDealers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profiles = await dealerService.getVerifiedDealers();
    res.json({ success: true, data: profiles });
  } catch (err) {
    next(err);
  }
};
