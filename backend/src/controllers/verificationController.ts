import { Request, Response, NextFunction } from 'express';
import * as verificationService from '../services/verificationService';

export const verifyDealerLicence = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Authenticated identity from JWT is authoritative
    const userId = req.user!.userId;

    // Only extract licenceNumber from request body — ignore/strip any client-supplied dealerUserId, status, source
    const { licenceNumber } = req.body;

    if (!licenceNumber) {
      res.status(400).json({
        success: false,
        error: { message: 'Licence number is required.' },
      });
      return;
    }

    const { result, profile, verificationRecord } = await verificationService.verifyDealerLicence(
      userId,
      licenceNumber
    );

    res.json({
      success: true,
      data: {
        verificationResult: result,
        profile,
        verificationId: verificationRecord._id,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getVerificationRecordById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authUserId = req.user!.userId;
    const authRole = req.user!.role;
    const id = req.params.id as string;

    const verificationRecord = await verificationService.getVerificationById(
      authUserId,
      authRole,
      id
    );

    res.json({
      success: true,
      data: { verificationRecord },
    });
  } catch (err) {
    next(err);
  }
};

export const getMyVerificationHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const history = await verificationService.getMyVerificationHistory(userId);
    res.json({
      success: true,
      data: { history },
    });
  } catch (err) {
    next(err);
  }
};
