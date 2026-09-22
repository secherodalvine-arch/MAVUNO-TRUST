import { Request, Response, NextFunction } from 'express';
import * as farmerService from '../services/farmerService';

export const createCropListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const listing = await farmerService.createCropListing(userId, req.body);
    res.status(201).json({ success: true, data: { listing } });
  } catch (err) {
    next(err);
  }
};

export const getMyCropListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const listings = await farmerService.getMyCropListings(userId);
    res.json({ success: true, data: { listings } });
  } catch (err) {
    next(err);
  }
};

export const getPublicCropListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { county, cropName } = req.query;
    const listings = await farmerService.getPublicCropListings({
      county: county as string,
      cropName: cropName as string,
    });
    res.json({ success: true, data: { listings } });
  } catch (err) {
    next(err);
  }
};

export const getCropListingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const listing = await farmerService.getCropListingById(id);
    res.json({ success: true, data: { listing } });
  } catch (err) {
    next(err);
  }
};

export const updateCropListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const listing = await farmerService.updateCropListing(userId, id, req.body);
    res.json({ success: true, data: { listing } });
  } catch (err) {
    next(err);
  }
};

export const deleteCropListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await farmerService.deleteCropListing(userId, id);
    res.json({ success: true, message: 'Crop listing deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
