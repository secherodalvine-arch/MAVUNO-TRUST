import { Request, Response, NextFunction } from 'express';
import * as farmerService from '../services/farmerService';

export const getMyFarmerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const profile = await farmerService.getFarmerProfileByUserId(userId);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

export const updateMyFarmerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const profile = await farmerService.updateFarmerProfile(userId, req.body);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

export const getPublicFarmerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const profile = await farmerService.getPublicFarmerProfile(id);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};
