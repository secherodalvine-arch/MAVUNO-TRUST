import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { createOffer, counterOffer, respondToOffer } from '../controllers/offerController';
import Offer, { OfferStatus } from '../models/Offer';
import DealerProfile, { VerificationStatus } from '../models/DealerProfile';
import mongoose from 'mongoose';
import FarmerCropListing from '../models/FarmerCropListing';
import AuditLog from '../models/AuditLog';

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error: any) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${error.message}`);
    throw error;
  }
}

const mockResponse = () => {
  const res: any = {};
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (data: any) => { res.body = data; return res; };
  return res as Response & { statusCode: number, body: any };
};

const mockNext = () => (err?: any) => { if (err) throw err; };

async function runTests() {
  console.log('\n🤝 MavunoTrust Offer & Counteroffer MVP Test Suite');
  console.log('==================================================================');

  let savedOffer: any = null;
  Offer.prototype.save = async function() {
    savedOffer = this;
    return this;
  };
  
  Offer.findById = function(id: any) {
    return {
      exec: async () => savedOffer && savedOffer._id.toString() === id.toString() ? savedOffer : null
    };
  } as any;

  AuditLog.create = async () => ({} as any);

  let mockDealerProfile: any = null;
  DealerProfile.findOne = function() {
    return mockDealerProfile;
  } as any;

  let mockListing: any = null;
  FarmerCropListing.findById = function(id: any) {
    return {
      exec: async () => mockListing && mockListing._id.toString() === id.toString() ? mockListing : null
    };
  } as any;

  await test('Authenticated farmer can create an offer to an eligible verified dealer', async () => {
    savedOffer = null;
    const farmerId = new mongoose.Types.ObjectId().toHexString();
    const dealerId = new mongoose.Types.ObjectId().toHexString();

    mockDealerProfile = { licence: { status: VerificationStatus.ACTIVE } };

    const listingId = new mongoose.Types.ObjectId().toHexString();
    mockListing = { _id: listingId, farmerId, estimatedQuantity: 50 };

    const req = {
      user: { userId: farmerId, role: 'FARMER' },
      body: {
        targetUserId: dealerId,
        listingId,
        quantity: 10,
        unit: 'KG',
        proposedPricePerUnit: 100
      }
    } as unknown as Request;
    const res = mockResponse();

    await createOffer(req, res, mockNext());

    if (res.statusCode !== 201) throw new Error(`Expected 201, got ${res.statusCode}`);
    if (savedOffer.farmerId.toString() !== farmerId) throw new Error('Incorrect farmerId');
    if (savedOffer.status !== OfferStatus.PENDING) throw new Error('Status not PENDING');
    if (savedOffer.totalAmount !== 1000) throw new Error('Incorrect total amount calculated');
  });

  await test('Unverified/ineligible dealer cannot receive a new offer', async () => {
    savedOffer = null;
    const farmerId = new mongoose.Types.ObjectId().toHexString();
    const dealerId = new mongoose.Types.ObjectId().toHexString();

    mockDealerProfile = { licence: { status: VerificationStatus.EXPIRED } }; // Not ACTIVE

    const listingId = new mongoose.Types.ObjectId().toHexString();
    mockListing = { _id: listingId, farmerId, estimatedQuantity: 50 };

    const req = {
      user: { userId: farmerId, role: 'FARMER' },
      body: {
        targetUserId: dealerId,
        listingId,
        quantity: 10,
        unit: 'KG',
        proposedPricePerUnit: 100
      }
    } as unknown as Request;
    const res = mockResponse();

    await createOffer(req, res, mockNext());

    if (res.statusCode !== 403) throw new Error(`Expected 403, got ${res.statusCode}`);
    if (savedOffer) throw new Error('Offer was saved despite unverified dealer');
  });

  await test('Farmer cannot make an offer to themselves', async () => {
    savedOffer = null;
    const farmerId = new mongoose.Types.ObjectId().toHexString();
    mockDealerProfile = { licence: { status: VerificationStatus.ACTIVE } };

    const req = {
      user: { userId: farmerId, role: 'FARMER' },
      body: { targetUserId: farmerId, listingId: '1', quantity: 10, unit: 'KG', proposedPricePerUnit: 100 }
    } as unknown as Request;
    const res = mockResponse();

    await createOffer(req, res, mockNext());

    if (res.statusCode !== 400) throw new Error(`Expected 400, got ${res.statusCode}`);
  });

  await test('Invalid quantities/prices are rejected', async () => {
    savedOffer = null;
    const farmerId = new mongoose.Types.ObjectId().toHexString();
    const dealerId = new mongoose.Types.ObjectId().toHexString();
    mockDealerProfile = { licence: { status: VerificationStatus.ACTIVE } };

    const req = {
      user: { userId: farmerId, role: 'FARMER' },
      body: { targetUserId: dealerId, listingId: '1', quantity: -10, unit: 'KG', proposedPricePerUnit: 100 }
    } as unknown as Request;
    const res = mockResponse();

    await createOffer(req, res, mockNext());
    if (res.statusCode !== 400) throw new Error(`Expected 400 for negative quantity`);
  });

  await test('Dealer can accept an offer (and creator cannot accept their own)', async () => {
    const farmerId = new mongoose.Types.ObjectId().toHexString();
    const dealerId = new mongoose.Types.ObjectId().toHexString();
    
    savedOffer = new Offer({
      _id: new mongoose.Types.ObjectId(),
      farmerId, dealerId, initiatedBy: 'FARMER', status: OfferStatus.PENDING
    });

    // 1. Creator (FARMER) tries to accept -> fails
    let req = { user: { userId: farmerId, role: 'FARMER' }, params: { id: savedOffer._id.toString() }, body: { action: 'ACCEPT' } } as unknown as Request;
    let res = mockResponse();
    await respondToOffer(req, res, mockNext());
    if (res.statusCode !== 403) throw new Error('Creator should not be able to accept own offer');

    // 2. Receiver (DEALER) tries to accept -> succeeds
    req = { user: { userId: dealerId, role: 'DEALER' }, params: { id: savedOffer._id.toString() }, body: { action: 'ACCEPT' } } as unknown as Request;
    res = mockResponse();
    await respondToOffer(req, res, mockNext());
    if (res.statusCode && res.statusCode !== 200) {
      console.log('Failure body:', res.body);
      throw new Error(`Receiver should be able to accept, got ${res.statusCode}`);
    }
    if (savedOffer.status !== OfferStatus.ACCEPTED) throw new Error('Status should be ACCEPTED');
  });

  await test('Dealer can create a counteroffer, changing status to COUNTERED', async () => {
    const farmerId = new mongoose.Types.ObjectId().toHexString();
    const dealerId = new mongoose.Types.ObjectId().toHexString();
    
    savedOffer = new Offer({
      _id: new mongoose.Types.ObjectId(),
      farmerId, dealerId, listingId: '1', quantity: 10, unit: 'KG', currency: 'KES',
      proposedPricePerUnit: 100, initiatedBy: 'FARMER', status: OfferStatus.PENDING
    });

    const req = {
      user: { userId: dealerId, role: 'DEALER' },
      params: { id: savedOffer._id.toString() },
      body: { quantity: 15, proposedPricePerUnit: 90, message: 'I want 15 bags for less' }
    } as unknown as Request;
    const res = mockResponse();

    let oldOfferRef = savedOffer;
    
    await counterOffer(req, res, mockNext());

    if (res.statusCode !== 201) throw new Error('Counteroffer failed');
    if (oldOfferRef.status !== OfferStatus.COUNTERED) throw new Error('Old offer status not updated');
    if (savedOffer.status !== OfferStatus.PENDING) throw new Error('New offer not PENDING');
    if (savedOffer.parentOfferId.toString() !== oldOfferRef._id.toString()) throw new Error('parentOfferId not chained');
    if (savedOffer.totalAmount !== 15 * 90) throw new Error('Total amount not recalculated correctly');
  });

  console.log('\n==================================================================');
  console.log('Results: All tests passed.\n');
}

runTests();
