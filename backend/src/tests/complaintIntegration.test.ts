import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { submitRemedy, getMyComplaints } from '../controllers/rightsController';
import Complaint from '../models/Complaint';

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error: any) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${error.message}`);
    process.exit(1);
  }
}

// Mocking Request and Response
const mockResponse = () => {
  const res: any = {};
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (data: any) => { res.body = data; return res; };
  return res as Response & { statusCode: number, body: any };
};

const mockNext = () => (err?: any) => { if (err) throw err; };

async function runTests() {
  console.log('\n⚖️ MavunoTrust Complaint Persistence Test Suite');
  console.log('==================================================================');

  // Override Complaint.prototype.save to avoid actual DB connection in these unit tests
  let savedComplaint: any = null;
  let mockFoundComplaints: any[] = [];
  
  Complaint.prototype.save = async function() {
    savedComplaint = this;
    return this;
  };

  Complaint.find = function(query: any) {
    return {
      select: () => ({
        sort: () => ({
          exec: async () => mockFoundComplaints.filter(c => c.reporterId === query.reporterId)
        })
      })
    };
  } as any;

  await test('Authenticated ownership is enforced and saved to Complaint model', async () => {
    savedComplaint = null;
    const req = {
      body: { category: 'payment', description: 'The dealer did not pay me.' },
      user: { userId: new mongoose.Types.ObjectId().toHexString(), role: 'FARMER' }
    } as unknown as Request;
    const res = mockResponse();

    await submitRemedy(req, res, mockNext());

    if (res.statusCode !== undefined && res.statusCode !== 200) {
       throw new Error(`Expected success, got ${res.statusCode}`);
    }
    if (!savedComplaint) {
      throw new Error('Complaint was not saved');
    }
    if (savedComplaint.reporterId.toString() !== (req as any).user.userId) {
      throw new Error('Authenticated user ID was not assigned as reporterId');
    }
    if (savedComplaint.category !== 'NON_PAYMENT') {
      throw new Error('Category was not mapped correctly');
    }
    if (savedComplaint.description !== 'The dealer did not pay me.') {
      throw new Error('Description was not saved from user input');
    }
  });

  await test('Arbitrary userId payload is ignored; backend controls ownership', async () => {
    savedComplaint = null;
    const fakeUserId = new mongoose.Types.ObjectId().toHexString();
    const realUserId = new mongoose.Types.ObjectId().toHexString();

    const req = {
      body: { category: 'price', description: 'Price disagreement.', userId: fakeUserId },
      user: { userId: realUserId, role: 'FARMER' }
    } as unknown as Request;
    const res = mockResponse();

    await submitRemedy(req, res, mockNext());

    if (savedComplaint.reporterId.toString() === fakeUserId) {
      throw new Error('System allowed arbitrary userId injection');
    }
    if (savedComplaint.reporterId.toString() !== realUserId) {
      throw new Error('System failed to enforce authenticated user ID');
    }
  });

  await test('Invalid predefined categories are rejected', async () => {
    savedComplaint = null;
    const req = {
      body: { category: 'invented_fake_category', description: 'Some issue' },
      user: { userId: new mongoose.Types.ObjectId().toHexString(), role: 'FARMER' }
    } as unknown as Request;
    const res = mockResponse();

    await submitRemedy(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error('System failed to reject invalid category');
    }
    if (savedComplaint) {
      throw new Error('System saved a complaint with an invalid category');
    }
  });

  await test('Empty or invalid submissions are rejected', async () => {
    savedComplaint = null;
    const req = {
      body: { category: 'payment', description: '' }, // empty description
      user: { userId: new mongoose.Types.ObjectId().toHexString(), role: 'FARMER' }
    } as unknown as Request;
    const res = mockResponse();

    await submitRemedy(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error('System failed to reject empty description');
    }
    if (savedComplaint) {
      throw new Error('System saved an empty complaint');
    }
  });

  await test('No fake government submission is claimed', async () => {
    savedComplaint = null;
    const req = {
      body: { category: 'other', description: 'Testing claim.' },
      user: { userId: new mongoose.Types.ObjectId().toHexString(), role: 'FARMER' }
    } as unknown as Request;
    const res = mockResponse();

    await submitRemedy(req, res, mockNext());

    const message = res.body?.message || '';
    if (message.includes('AFA received it') || message.includes('resolved')) {
      throw new Error('System made false claims about resolution or government receipt');
    }
  });

  await test('Authenticated farmer can retrieve their own complaints and another farmer’s are excluded', async () => {
    const farmerA = new mongoose.Types.ObjectId().toHexString();
    const farmerB = new mongoose.Types.ObjectId().toHexString();
    
    mockFoundComplaints = [
      { caseId: 'MT-1', reporterId: farmerA, category: 'NON_PAYMENT', description: 'desc A' },
      { caseId: 'MT-2', reporterId: farmerB, category: 'PRICE_DISPUTE', description: 'desc B' }
    ];

    const req = {
      user: { userId: farmerA, role: 'FARMER' }
    } as unknown as Request;
    const res = mockResponse();

    await getMyComplaints(req, res, mockNext());

    const data = res.body?.data || [];
    if (data.length !== 1 || data[0].caseId !== 'MT-1') {
      throw new Error('System failed to retrieve only Farmer A’s complaints');
    }
  });

  await test('Unauthenticated access to retrieve complaints is rejected', async () => {
    const req = { user: undefined } as unknown as Request;
    const res = mockResponse();

    await getMyComplaints(req, res, mockNext());

    if (res.statusCode !== 401) {
      throw new Error('System allowed unauthenticated access to view complaints');
    }
  });

  console.log('\n==================================================================');
  console.log('Results: All tests passed.\n');
}

runTests();
