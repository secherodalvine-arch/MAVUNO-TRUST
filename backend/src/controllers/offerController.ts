import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Offer, { OfferStatus } from '../models/Offer';
import DealerProfile, { VerificationStatus } from '../models/DealerProfile';
import AuditLog, { AuditAction, AuditResourceType } from '../models/AuditLog';
import User from '../models/User';
import Transaction, { TransactionStatus } from '../models/Transaction';
import FarmerCropListing from '../models/FarmerCropListing';

/**
 * Validates participant IDs, handles basic numeric checks, and prevents offering to oneself.
 */
export const createOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
    const authRole = (req as any).user?.role;
    const { targetUserId, listingId, quantity, unit, proposedPricePerUnit, currency, message } = req.body;

    if (!authUserId || !authRole) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
      return;
    }

    if (!targetUserId || !listingId || !quantity || !unit || proposedPricePerUnit === undefined) {
      res.status(400).json({ success: false, error: { message: 'Missing required fields.' } });
      return;
    }

    if (authUserId === targetUserId) {
      res.status(400).json({ success: false, error: { message: 'Cannot make an offer to yourself.' } });
      return;
    }

    if (quantity <= 0 || proposedPricePerUnit < 0) {
      res.status(400).json({ success: false, error: { message: 'Quantity and price must be positive.' } });
      return;
    }

    let farmerId: string;
    let dealerId: string;
    let initiatedBy: 'FARMER' | 'DEALER';

    if (authRole === 'FARMER') {
      farmerId = authUserId;
      dealerId = targetUserId;
      initiatedBy = 'FARMER';
    } else if (authRole === 'DEALER') {
      farmerId = targetUserId;
      dealerId = authUserId;
      initiatedBy = 'DEALER';
    } else {
      res.status(403).json({ success: false, error: { message: 'Invalid role for offer creation.' } });
      return;
    }

    // Dealer Verification Check
    const targetDealerProfile = await DealerProfile.findOne({ userId: dealerId });
    if (!targetDealerProfile || targetDealerProfile.licence?.status !== VerificationStatus.ACTIVE) {
      res.status(403).json({ success: false, error: { message: 'Dealer is not actively verified for trading.' } });
      return;
    }

    // Listing validation
    const listing = await mongoose.model('FarmerCropListing').findById(listingId).exec();
    if (!listing) {
      res.status(404).json({ success: false, error: { message: 'Crop listing not found.' } });
      return;
    }
    if (listing.farmerId.toString() !== farmerId) {
      res.status(403).json({ success: false, error: { message: 'Listing does not belong to the authenticated farmer.' } });
      return;
    }
    if (quantity > listing.estimatedQuantity) {
      res.status(400).json({ success: false, error: { message: 'Cannot offer more than the available listing quantity.' } });
      return;
    }

    const totalAmount = quantity * proposedPricePerUnit;

    const newOffer = new Offer({
      farmerId,
      dealerId,
      listingId,
      quantity,
      unit,
      proposedPricePerUnit,
      currency: currency || 'KES',
      totalAmount,
      initiatedBy,
      message: message ? message.trim() : undefined,
      status: OfferStatus.PENDING
    });

    await newOffer.save();

    await AuditLog.create({
      actorId: authUserId,
      actorRole: authRole,
      action: 'CREATE_OFFER' as AuditAction,
      resourceType: 'OFFER' as AuditResourceType,
      resourceId: (newOffer._id as any).toString(),
    }).catch(console.error);

    res.status(201).json({ success: true, data: newOffer });
  } catch (err) {
    next(err);
  }
};

export const getMyOffers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
    if (!authUserId) {
       res.status(401).json({ success: false, error: { message: 'Unauthorized.' } });
       return;
    }

    const offers = await Offer.find({
      $or: [{ farmerId: authUserId }, { dealerId: authUserId }]
    })
      .populate('farmerId', 'fullName _id')
      .populate('dealerId', 'fullName _id')
      .sort({ createdAt: -1 })
      .exec();

    res.json({ success: true, data: offers });
  } catch (err) {
    next(err);
  }
};

export const getOfferHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
    const { id } = req.params; // ID of the latest offer in the chain

    const offer = await Offer.findById(id).exec();
    if (!offer) {
       res.status(404).json({ success: false, error: { message: 'Offer not found.' } });
       return;
    }

    if (offer.farmerId.toString() !== authUserId && offer.dealerId.toString() !== authUserId) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized.' } });
      return;
    }

    // Traverse parentOfferId backwards to get history
    const history = [];
    let currentOffer: any = offer;
    while (currentOffer) {
      history.push(currentOffer);
      if (currentOffer.parentOfferId) {
        currentOffer = await Offer.findById(currentOffer.parentOfferId)
          .populate('farmerId', 'fullName _id')
          .populate('dealerId', 'fullName _id')
          .exec();
      } else {
        break;
      }
    }

    res.json({ success: true, data: history.reverse() });
  } catch (err) {
    next(err);
  }
}

export const counterOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
    const authRole = (req as any).user?.role;
    const { id } = req.params;
    const { quantity, proposedPricePerUnit, message } = req.body;

    const originalOffer = await Offer.findById(id).exec();
    if (!originalOffer) {
      res.status(404).json({ success: false, error: { message: 'Original offer not found.' } });
      return;
    }

    if (originalOffer.farmerId.toString() !== authUserId && originalOffer.dealerId.toString() !== authUserId) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized.' } });
      return;
    }

    if (originalOffer.status !== OfferStatus.PENDING) {
      res.status(400).json({ success: false, error: { message: 'Can only counter a PENDING offer.' } });
      return;
    }

    if (quantity <= 0 || proposedPricePerUnit < 0) {
      res.status(400).json({ success: false, error: { message: 'Quantity and price must be positive.' } });
      return;
    }

    const totalAmount = quantity * proposedPricePerUnit;

    const newOffer = new Offer({
      farmerId: originalOffer.farmerId,
      dealerId: originalOffer.dealerId,
      listingId: originalOffer.listingId,
      quantity,
      unit: originalOffer.unit,
      proposedPricePerUnit,
      currency: originalOffer.currency,
      totalAmount,
      initiatedBy: authRole === 'FARMER' ? 'FARMER' : 'DEALER',
      message: message ? message.trim() : undefined,
      parentOfferId: originalOffer._id,
      status: OfferStatus.PENDING
    });

    originalOffer.status = OfferStatus.COUNTERED;
    await originalOffer.save();
    await newOffer.save();

    await AuditLog.create({
      actorId: authUserId,
      actorRole: authRole,
      action: 'COUNTER_OFFER' as AuditAction,
      resourceType: 'OFFER' as AuditResourceType,
      resourceId: (newOffer._id as any).toString(),
    }).catch(console.error);

    res.status(201).json({ success: true, data: newOffer });
  } catch (err) {
    next(err);
  }
};

export const respondToOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = (req as any).user?.userId;
    const authRole = (req as any).user?.role;
    const { id } = req.params;
    const { action } = req.body; // 'ACCEPT', 'REJECT', 'CANCEL'

    if (!['ACCEPT', 'REJECT', 'CANCEL'].includes(action)) {
      res.status(400).json({ success: false, error: { message: 'Invalid action.' } });
      return;
    }

    const offer = await Offer.findById(id).exec();
    if (!offer) {
      res.status(404).json({ success: false, error: { message: 'Offer not found.' } });
      return;
    }

    if (offer.farmerId.toString() !== authUserId && offer.dealerId.toString() !== authUserId) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized.' } });
      return;
    }

    if (offer.status !== OfferStatus.PENDING) {
      res.status(400).json({ success: false, error: { message: 'Can only respond to a PENDING offer.' } });
      return;
    }

    const isCreator = (offer.initiatedBy === 'FARMER' && offer.farmerId.toString() === authUserId) ||
                      (offer.initiatedBy === 'DEALER' && offer.dealerId.toString() === authUserId);
    const isReceiver = !isCreator;

    let newStatus: OfferStatus;
    let auditAction: string;

    if (action === 'ACCEPT' || action === 'REJECT') {
      if (!isReceiver) {
        res.status(403).json({ success: false, error: { message: `Creator cannot ${action.toLowerCase()} their own offer.` } });
        return;
      }
      newStatus = action === 'ACCEPT' ? OfferStatus.ACCEPTED : OfferStatus.REJECTED;
      auditAction = action === 'ACCEPT' ? 'ACCEPT_OFFER' : 'REJECT_OFFER';
    } else { // CANCEL
      if (!isCreator) {
        res.status(403).json({ success: false, error: { message: 'Only creator can cancel the offer.' } });
        return;
      }
      newStatus = OfferStatus.WITHDRAWN;
      auditAction = 'CANCEL_OFFER';
    }

    offer.status = newStatus;
    await offer.save();

    // AUTOMATIC TRANSACTION CREATION
    if (newStatus === OfferStatus.ACCEPTED) {
      // Create transaction only if one doesn't already exist for this offer
      const existingTx = await Transaction.findOne({ acceptedOfferId: offer._id });
      if (!existingTx) {
        const listing = await FarmerCropListing.findById(offer.listingId).exec();
        
        await Transaction.create({
          farmerId: offer.farmerId,
          dealerId: offer.dealerId,
          listingId: offer.listingId,
          acceptedOfferId: offer._id,
          cropName: listing ? listing.cropName || 'Unknown Crop' : 'Unknown Crop',
          quantity: offer.quantity,
          unit: offer.unit,
          agreedPricePerUnit: offer.proposedPricePerUnit,
          totalAgreedValue: offer.totalAmount,
          currency: offer.currency,
          agreementDate: new Date(),
          status: TransactionStatus.AGREED
        });
      }
    }

    await AuditLog.create({
      actorId: authUserId,
      actorRole: authRole,
      action: auditAction as AuditAction,
      resourceType: 'OFFER' as AuditResourceType,
      resourceId: (offer._id as any).toString(),
    }).catch(console.error);

    res.json({ success: true, data: offer });
  } catch (err) {
    next(err);
  }
};
