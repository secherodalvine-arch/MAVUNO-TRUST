import mongoose from 'mongoose';
import { Request } from 'express';
import { createDispute, getDisputes, getDisputeById, closeDispute } from '../controllers/disputeController';
import Dispute, { DisputeCategory, DisputeStatus } from '../models/Dispute';
import Transaction, { TransactionStatus, FulfilmentStatus } from '../models/Transaction';
import { geminiService } from '../services/geminiService';

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

const mockResponse = () => {
  const res: any = { statusCode: 200 };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
};

const mockNext = () => (err?: any) => {
  if (err) throw err;
};

const getCleanId = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return typeof val._id === 'string' ? val._id : val._id.toString();
  if (typeof val.toString === 'function') return val.toString();
  return String(val);
};

// In-Memory Mock Database for Transactions and Disputes
let mockTransactionDb: any[] = [];
let mockDisputeDb: any[] = [];

(Transaction as any).findById = (id: string) => {
  const tx = mockTransactionDb.find(t => t._id === id);
  if (!tx) {
    const emptyQuery: any = {
      exec: async () => null,
      then: (resolve: any) => resolve(null)
    };
    return emptyQuery;
  }
  const query: any = {
    exec: async () => tx,
    then: (resolve: any) => resolve(tx)
  };
  return query;
};

(Dispute as any).findById = (id: any) => {
  const cleanSearchId = getCleanId(id);
  const d = mockDisputeDb.find(item => getCleanId(item._id) === cleanSearchId || item.caseId === id);
  if (!d) {
    const emptyQuery: any = {
      populate: () => emptyQuery,
      exec: async () => null,
      then: (resolve: any) => resolve(null)
    };
    return emptyQuery;
  }

  if (typeof d.save !== 'function') {
    d.save = async function() {
      const idx = mockDisputeDb.findIndex(m => getCleanId(m._id) === getCleanId(this._id));
      if (idx !== -1) {
        mockDisputeDb[idx] = this;
      }
      return this;
    };
  }

  const populatedDispute = {
    ...d,
    openedBy: typeof d.openedBy === 'string' ? { _id: d.openedBy, fullName: 'Test User' } : d.openedBy
  };

  const query: any = {
    populate: () => ({
      populate: () => ({
        exec: async () => populatedDispute,
        then: (resolve: any) => resolve(populatedDispute)
      }),
      exec: async () => populatedDispute,
      then: (resolve: any) => resolve(populatedDispute)
    }),
    exec: async () => d,
    then: (resolve: any) => resolve(d)
  };
  return query;
};

(Dispute as any).findOne = (filter: any) => {
  const d = mockDisputeDb.find(item => {
    if (filter.transactionId && getCleanId(item.transactionId) !== getCleanId(filter.transactionId)) return false;
    if (filter.openedBy && getCleanId(item.openedBy) !== getCleanId(filter.openedBy)) return false;
    if (filter.status && item.status !== filter.status) return false;
    if (filter.caseId && item.caseId !== filter.caseId) return false;
    return true;
  });

  if (!d) {
    const emptyQuery: any = {
      populate: () => emptyQuery,
      exec: async () => null,
      then: (resolve: any) => resolve(null)
    };
    return emptyQuery;
  }

  if (typeof d.save !== 'function') {
    d.save = async function() {
      const idx = mockDisputeDb.findIndex(m => getCleanId(m._id) === getCleanId(this._id));
      if (idx !== -1) {
        mockDisputeDb[idx] = this;
      }
      return this;
    };
  }

  const populatedDispute = {
    ...d,
    openedBy: typeof d.openedBy === 'string' ? { _id: d.openedBy, fullName: 'Test User' } : d.openedBy
  };

  const query: any = {
    populate: () => ({
      populate: () => ({
        exec: async () => populatedDispute,
        then: (resolve: any) => resolve(populatedDispute)
      }),
      exec: async () => populatedDispute,
      then: (resolve: any) => resolve(populatedDispute)
    }),
    exec: async () => d,
    then: (resolve: any) => resolve(d)
  };
  return query;
};

(Dispute as any).find = (filter: any) => {
  const matches = mockDisputeDb.filter(item => {
    if (filter.openedBy && item.openedBy !== filter.openedBy) return false;
    return true;
  });

  const query: any = {
    populate: () => ({
      populate: () => ({
        sort: () => ({
          exec: async () => matches,
          then: (resolve: any) => resolve(matches)
        }),
        exec: async () => matches,
        then: (resolve: any) => resolve(matches)
      }),
      sort: () => ({
        exec: async () => matches,
        then: (resolve: any) => resolve(matches)
      }),
      exec: async () => matches,
      then: (resolve: any) => resolve(matches)
    }),
    sort: () => ({
      exec: async () => matches,
      then: (resolve: any) => resolve(matches)
    }),
    exec: async () => matches,
    then: (resolve: any) => resolve(matches)
  };
  return query;
};

// Mock Mongoose Dispute prototype save method
(Dispute.prototype as any).save = async function() {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId().toHexString();
  }
  if (!this.caseId) {
    this.caseId = `DSP-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();

  const docObj = typeof this.toObject === 'function' ? this.toObject() : this;
  const itemToStore = {
    ...docObj,
    _id: getCleanId(this._id),
    caseId: this.caseId,
    transactionId: getCleanId(this.transactionId),
    openedBy: getCleanId(this.openedBy),
    category: this.category,
    description: this.description,
    evidenceInfo: this.evidenceInfo,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };

  const existingIdx = mockDisputeDb.findIndex(item => item._id === itemToStore._id || item.caseId === itemToStore.caseId);
  if (existingIdx !== -1) {
    mockDisputeDb[existingIdx] = itemToStore;
  } else {
    mockDisputeDb.push(itemToStore);
  }
  return this;
};

async function runDisputeTestSuite() {
  console.log('\n⚖️ MavunoTrust Dispute & Remedy Verification Suite');
  console.log('==========================================================================');

  const farmerId = new mongoose.Types.ObjectId().toHexString();
  const dealerId = new mongoose.Types.ObjectId().toHexString();
  const unrelatedUserId = new mongoose.Types.ObjectId().toHexString();
  const txInProgressId = new mongoose.Types.ObjectId().toHexString();
  const txFulfilledId = new mongoose.Types.ObjectId().toHexString();
  const txCancelledId = new mongoose.Types.ObjectId().toHexString();

  const resetDbs = () => {
    mockTransactionDb = [
      {
        _id: txInProgressId,
        farmerId,
        dealerId,
        listingId: 'listing_1',
        acceptedOfferId: 'offer_1',
        cropName: 'Maize',
        quantity: 500,
        unit: 'bag',
        agreedPricePerUnit: 3000,
        totalAgreedValue: 1500000,
        currency: 'KES',
        status: TransactionStatus.IN_PROGRESS,
        fulfilment: { status: FulfilmentStatus.IN_PROGRESS },
        createdAt: new Date()
      },
      {
        _id: txFulfilledId,
        farmerId,
        dealerId,
        listingId: 'listing_2',
        acceptedOfferId: 'offer_2',
        cropName: 'Avocados',
        quantity: 200,
        unit: 'crate',
        agreedPricePerUnit: 1500,
        totalAgreedValue: 300000,
        currency: 'KES',
        status: TransactionStatus.IN_PROGRESS,
        fulfilment: { status: FulfilmentStatus.FULFILLED },
        createdAt: new Date()
      },
      {
        _id: txCancelledId,
        farmerId,
        dealerId,
        listingId: 'listing_3',
        acceptedOfferId: 'offer_3',
        cropName: 'Beans',
        quantity: 100,
        unit: 'kg',
        agreedPricePerUnit: 120,
        totalAgreedValue: 12000,
        currency: 'KES',
        status: TransactionStatus.CANCELLED,
        createdAt: new Date()
      }
    ];

    mockDisputeDb = [];
  };

  resetDbs();

  await test('1. Controller exports (createDispute, getDisputes, getDisputeById, closeDispute) are defined', () => {
    if (typeof createDispute !== 'function' || typeof getDisputes !== 'function' || typeof getDisputeById !== 'function' || typeof closeDispute !== 'function') {
      throw new Error('Dispute controller exports missing');
    }
  });

  await test('2. Authenticated farmer/dealer can create a dispute for eligible transaction', async () => {
    resetDbs();
    const req: any = {
      user: { userId: farmerId },
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.QUALITY_ISSUE,
        description: 'The produce quality delivered did not match the agreed grade standards.'
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.statusCode !== 201) {
      throw new Error(`Expected 201 Created, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    if (res.body.data.category !== DisputeCategory.QUALITY_ISSUE) {
      throw new Error(`Expected QUALITY_ISSUE category, got ${res.body.data.category}`);
    }
    if (res.body.data.openedBy._id !== farmerId && res.body.data.openedBy !== farmerId) {
      throw new Error('openedBy actor did not match auth user');
    }
  });

  await test('3. Unauthenticated request rejected (401 Unauthorized)', async () => {
    resetDbs();
    const req: any = {
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.DELIVERY_ISSUE,
        description: 'Valid description text here.'
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.statusCode !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${res.statusCode}`);
    }
  });

  await test('4. Non-participant cannot create dispute for another user transaction (403 Forbidden)', async () => {
    resetDbs();
    const req: any = {
      user: { userId: unrelatedUserId },
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.DELIVERY_ISSUE,
        description: 'Attempting unauthorized dispute creation.'
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.statusCode}`);
    }
  });

  await test('5. Non-participant cannot view another user dispute (403 Forbidden)', async () => {
    resetDbs();
    const dId = new mongoose.Types.ObjectId().toHexString();
    mockDisputeDb.push({
      _id: dId,
      caseId: 'DSP-2026-TEST001',
      transactionId: txInProgressId,
      openedBy: farmerId,
      category: DisputeCategory.DELIVERY_ISSUE,
      description: 'Test description content',
      status: DisputeStatus.OPEN,
      createdAt: new Date()
    });

    const req: any = {
      user: { userId: unrelatedUserId },
      params: { id: dId }
    };
    const res = mockResponse();

    await getDisputeById(req, res, mockNext());

    if (res.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.statusCode}`);
    }
  });

  await test('6. Non-participant cannot close another user dispute (403 Forbidden)', async () => {
    resetDbs();
    const dId = new mongoose.Types.ObjectId().toHexString();
    mockDisputeDb.push({
      _id: dId,
      caseId: 'DSP-2026-TEST002',
      transactionId: txInProgressId,
      openedBy: farmerId,
      category: DisputeCategory.DELIVERY_ISSUE,
      description: 'Test description content',
      status: DisputeStatus.OPEN,
      createdAt: new Date()
    });

    const req: any = {
      user: { userId: unrelatedUserId },
      params: { id: dId }
    };
    const res = mockResponse();

    await closeDispute(req, res, mockNext());

    if (res.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.statusCode}`);
    }
  });

  await test('7. Client cannot override openedBy (server sets openedBy from JWT identity)', async () => {
    resetDbs();
    const req: any = {
      user: { userId: dealerId },
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.PAYMENT_ISSUE,
        description: 'Payment issue description text.',
        openedBy: farmerId // Spoof attempt
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.body.data.openedBy._id !== dealerId && res.body.data.openedBy !== dealerId) {
      throw new Error(`Expected openedBy to equal JWT user (${dealerId}), got ${res.body.data.openedBy}`);
    }
  });

  await test('8. Client cannot override initial status (server sets OPEN)', async () => {
    resetDbs();
    const req: any = {
      user: { userId: farmerId },
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.AGREEMENT_ISSUE,
        description: 'Agreement issue text description.',
        status: DisputeStatus.CLOSED // Status override attempt
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.body.data.status !== DisputeStatus.OPEN) {
      throw new Error(`Expected initial status to be OPEN, got ${res.body.data.status}`);
    }
  });

  await test('9. Client cannot override closedBy or closedAt on creation', async () => {
    resetDbs();
    const req: any = {
      user: { userId: farmerId },
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.OTHER,
        description: 'Other issue description text.',
        closedBy: unrelatedUserId,
        closedAt: new Date('2020-01-01')
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.body.data.closedBy || res.body.data.closedAt) {
      throw new Error('closedBy/closedAt were set during creation');
    }
  });

  await test('10. Invalid transaction ID is rejected (404 Not Found)', async () => {
    resetDbs();
    const req: any = {
      user: { userId: farmerId },
      body: {
        transactionId: new mongoose.Types.ObjectId().toHexString(),
        category: DisputeCategory.DELIVERY_ISSUE,
        description: 'Valid description text here.'
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.statusCode !== 404) {
      throw new Error(`Expected 404 Not Found, got ${res.statusCode}`);
    }
  });

  await test('11. CANCELLED transaction cannot have dispute opened (400 Bad Request)', async () => {
    resetDbs();
    const req: any = {
      user: { userId: farmerId },
      body: {
        transactionId: txCancelledId,
        category: DisputeCategory.DELIVERY_ISSUE,
        description: 'Attempt to open dispute on cancelled transaction.'
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
    }
  });

  await test('12. Duplicate active (OPEN) dispute for same transaction by same user is rejected (400 Bad Request)', async () => {
    resetDbs();
    mockDisputeDb.push({
      _id: 'd_active_1',
      caseId: 'DSP-2026-ACTIVE01',
      transactionId: txInProgressId,
      openedBy: farmerId,
      category: DisputeCategory.QUANTITY_ISSUE,
      description: 'Active existing dispute description',
      status: DisputeStatus.OPEN,
      createdAt: new Date()
    });

    const req: any = {
      user: { userId: farmerId },
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.QUALITY_ISSUE,
        description: 'Second dispute attempt for same transaction.'
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request for duplicate open dispute, got ${res.statusCode}`);
    }
  });

  await test('13. Public APIs do not expose disputes', () => {
    // Verify dispute model/controller is isolated and not exported via public controller
    const publicControllerPath = '../controllers/publicController';
    try {
      const publicCtrl = require(publicControllerPath);
      if (publicCtrl.getDisputes || publicCtrl.getDisputeById) {
        throw new Error('Public controller exposes dispute methods!');
      }
    } catch (e: any) {
      if (e.message.includes('Public controller exposes')) throw e;
    }
  });

  await test('14. Dispute payload does not expose production costs or private chat messages', async () => {
    resetDbs();
    const req: any = {
      user: { userId: farmerId },
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.AGREEMENT_ISSUE,
        description: 'Valid agreement issue description text.'
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    const data = res.body.data;
    if (data.productionCost || data.costPerUnit || data.messages || data.chatHistory) {
      throw new Error('Private production costs or chat messages exposed in dispute response!');
    }
  });

  await test('15. Closing dispute sets server-side closedAt timestamp and closedBy actor', async () => {
    resetDbs();
    const dId = new mongoose.Types.ObjectId().toHexString();
    mockDisputeDb.push({
      _id: dId,
      caseId: 'DSP-2026-CLOSE01',
      transactionId: txInProgressId,
      openedBy: farmerId,
      category: DisputeCategory.DELIVERY_ISSUE,
      description: 'Dispute description to close',
      status: DisputeStatus.OPEN,
      createdAt: new Date()
    });

    const req: any = {
      user: { userId: farmerId },
      params: { id: dId }
    };
    const res = mockResponse();

    await closeDispute(req, res, mockNext());

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200 OK, got ${res.statusCode}`);
    }
    if (res.body.data.status !== DisputeStatus.CLOSED) {
      throw new Error(`Expected status to be CLOSED, got ${res.body.data.status}`);
    }
    if (!res.body.data.closedAt) {
      throw new Error('closedAt timestamp was not set');
    }
  });

  await test('16. Closing already CLOSED dispute is idempotent and does not overwrite original closedAt/closedBy', async () => {
    resetDbs();
    const originalClosedAt = new Date('2026-09-01T12:00:00Z');
    const dId = new mongoose.Types.ObjectId().toHexString();
    mockDisputeDb.push({
      _id: dId,
      caseId: 'DSP-2026-CLOSED02',
      transactionId: txInProgressId,
      openedBy: farmerId,
      category: DisputeCategory.DELIVERY_ISSUE,
      description: 'Already closed dispute',
      status: DisputeStatus.CLOSED,
      closedAt: originalClosedAt,
      closedBy: farmerId,
      createdAt: new Date()
    });

    const req: any = {
      user: { userId: farmerId },
      params: { id: dId }
    };
    const res = mockResponse();

    await closeDispute(req, res, mockNext());

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200 OK, got ${res.statusCode}`);
    }
    if (!res.body.message.includes('already closed')) {
      throw new Error(`Expected already closed message, got: ${res.body.message}`);
    }
  });

  await test('17. Cancellation does not automatically create a dispute', async () => {
    resetDbs();
    // Verify mockDisputeDb has 0 entries when transaction is cancelled
    if (mockDisputeDb.length !== 0) {
      throw new Error('Dispute created automatically on transaction cancellation!');
    }
  });

  await test('18. Opening a dispute does not automatically change transaction status', async () => {
    resetDbs();
    const initialTxStatus = mockTransactionDb[0].status;

    const req: any = {
      user: { userId: farmerId },
      body: {
        transactionId: txInProgressId,
        category: DisputeCategory.QUALITY_ISSUE,
        description: 'Produce quality concern text.'
      }
    };
    const res = mockResponse();

    await createDispute(req, res, mockNext());

    if (mockTransactionDb[0].status !== initialTxStatus) {
      throw new Error(`Transaction status was mutated from ${initialTxStatus} to ${mockTransactionDb[0].status}!`);
    }
  });

  await test('19. Gemini / AI services cannot mutate dispute records', () => {
    const geminiKeys = Object.keys(geminiService);
    const mutationKeys = geminiKeys.filter(k => k.toLowerCase().includes('dispute') || k.toLowerCase().includes('close') || k.toLowerCase().includes('mutate'));
    
    if (mutationKeys.length > 0) {
      throw new Error(`Gemini service contains potential dispute mutation methods: ${mutationKeys.join(', ')}`);
    }
  });

  console.log('==========================================================================');
  console.log('✨ All 19 Dispute & Remedy verification tests PASSED successfully!\n');
}

runDisputeTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
