import mongoose from 'mongoose';
import { Request } from 'express';
import { completeTransaction, getTransactionById } from '../controllers/transactionController';
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

// In-Memory Mock Database for Transactions
let mockDb: any[] = [];

(Transaction as any).findById = (id: string) => {
  const tx = mockDb.find(t => t._id === id);
  if (!tx) {
    const emptyQuery: any = {
      populate: () => emptyQuery,
      exec: async () => null,
      then: (resolve: any) => resolve(null)
    };
    return emptyQuery;
  }

  tx.save = async function() {
    const idx = mockDb.findIndex(m => m._id === id);
    if (idx !== -1) {
      mockDb[idx] = this;
    }
    return this;
  };

  const populatedTx = {
    ...tx,
    farmerId: { _id: tx.farmerId, fullName: 'Farmer Test User' },
    dealerId: { _id: tx.dealerId, fullName: 'Dealer Test User' }
  };

  const query: any = {
    populate: () => ({
      populate: () => ({
        exec: async () => populatedTx,
        then: (resolve: any) => resolve(populatedTx)
      }),
      exec: async () => populatedTx,
      then: (resolve: any) => resolve(populatedTx)
    }),
    exec: async () => tx,
    then: (resolve: any) => resolve(tx)
  };

  return query;
};

async function runCompletionTestSuite() {
  console.log('\n🏁 MavunoTrust Transaction Completion Verification Suite');
  console.log('==========================================================================');

  const farmerId = new mongoose.Types.ObjectId().toHexString();
  const dealerId = new mongoose.Types.ObjectId().toHexString();
  const unrelatedUserId = new mongoose.Types.ObjectId().toHexString();

  const resetDb = () => {
    mockDb = [
      {
        _id: 'tx_fulfilled',
        farmerId,
        dealerId,
        listingId: 'listing_1',
        acceptedOfferId: 'offer_1',
        cropName: 'Avocados',
        quantity: 500,
        unit: 'kg',
        agreedPricePerUnit: 150,
        totalAgreedValue: 75000,
        currency: 'KES',
        status: TransactionStatus.IN_PROGRESS,
        fulfilment: {
          status: FulfilmentStatus.FULFILLED,
          method: 'Farmer Delivery to Depot',
          expectedFulfilmentDate: new Date(),
          actualFulfilmentDate: new Date(),
          notes: 'Fulfilled and verified'
        },
        agreementDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'tx_pending_fulfilment',
        farmerId,
        dealerId,
        listingId: 'listing_2',
        acceptedOfferId: 'offer_2',
        cropName: 'Maize',
        quantity: 1000,
        unit: 'kg',
        agreedPricePerUnit: 50,
        totalAgreedValue: 50000,
        currency: 'KES',
        status: TransactionStatus.IN_PROGRESS,
        fulfilment: {
          status: FulfilmentStatus.PENDING
        },
        agreementDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'tx_agreed_unfulfilled',
        farmerId,
        dealerId,
        listingId: 'listing_3',
        acceptedOfferId: 'offer_3',
        cropName: 'Coffee',
        quantity: 300,
        unit: 'kg',
        agreedPricePerUnit: 400,
        totalAgreedValue: 120000,
        currency: 'KES',
        status: TransactionStatus.AGREED,
        fulfilment: {
          status: FulfilmentStatus.PENDING
        },
        agreementDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  };

  resetDb();

  await test('1. Controller export completeTransaction is defined', () => {
    if (typeof completeTransaction !== 'function') {
      throw new Error('completeTransaction function is not exported');
    }
  });

  await test('2. Successful completion by Farmer when transaction IN_PROGRESS and enrolment FULFILLED', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    if (res.body.data.status !== TransactionStatus.COMPLETED) {
      throw new Error(`Expected COMPLETED status, got ${res.body.data.status}`);
    }
    if (res.body.data.completedBy !== farmerId) {
      throw new Error(`Expected completedBy to be farmerId, got ${res.body.data.completedBy}`);
    }
    if (!res.body.data.completedAt) {
      throw new Error('Expected completedAt timestamp');
    }
  });

  await test('3. Successful completion by Dealer when transaction IN_PROGRESS and enrolment FULFILLED', async () => {
    resetDb();
    const req: any = {
      user: { userId: dealerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    if (res.body.data.status !== TransactionStatus.COMPLETED) {
      throw new Error(`Expected COMPLETED status, got ${res.body.data.status}`);
    }
    if (res.body.data.completedBy !== dealerId) {
      throw new Error(`Expected completedBy to be dealerId, got ${res.body.data.completedBy}`);
    }
  });

  await test('4. Blocked 403 Forbidden for unauthorized user attempting completion', async () => {
    resetDb();
    const req: any = {
      user: { userId: unrelatedUserId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.statusCode}`);
    }
  });

  await test('5. Blocked 401 Unauthorized for unauthenticated request', async () => {
    resetDb();
    const req: any = {
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.statusCode !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${res.statusCode}`);
    }
  });

  await test('6. Rejection 400 Bad Request when fulfilment status is PENDING', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_pending_fulfilment' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
    }
    if (!res.body.error.message.toUpperCase().includes('FULFILLED')) {
      throw new Error(`Unexpected error message: ${res.body.error.message}`);
    }
  });

  await test('7. Rejection 400 Bad Request when fulfilment status is IN_PROGRESS (not FULFILLED)', async () => {
    resetDb();
    mockDb[0].fulfilment.status = FulfilmentStatus.IN_PROGRESS;
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
    }
  });

  await test('8. Rejection 400 Bad Request when direct AGREED status completion is attempted', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed_unfulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
    }
  });

  await test('9. Idempotency: Completing already COMPLETED transaction returns 200 OK without errors', async () => {
    resetDb();
    // Complete first
    mockDb[0].status = TransactionStatus.COMPLETED;
    mockDb[0].completedAt = new Date();
    mockDb[0].completedBy = farmerId;

    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}`);
    }
    if (!res.body.message.includes('already completed')) {
      throw new Error(`Expected already completed message, got: ${res.body.message}`);
    }
  });

  await test('10. Server-side timestamp completedAt generated automatically', async () => {
    resetDb();
    const beforeTime = new Date().getTime();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    const completedAtTime = new Date(res.body.data.completedAt).getTime();
    if (completedAtTime < beforeTime) {
      throw new Error('completedAt timestamp was not generated server-side');
    }
  });

  await test('11. Server-side actor ID completedBy recorded automatically', async () => {
    resetDb();
    const req: any = {
      user: { userId: dealerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.body.data.completedBy !== dealerId) {
      throw new Error(`Expected completedBy to equal ${dealerId}, got ${res.body.data.completedBy}`);
    }
  });

  await test('12. Strict scope enforcement — No payment records or escrow fields created', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    const data = res.body.data;
    if (data.payment || data.escrow || data.mpesaReceipt || data.paymentStatus) {
      throw new Error('Payment/Escrow fields detected in completed transaction payload!');
    }
  });

  await test('13. Privacy protection — Production costs not present in completion payload', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.body.data.productionCost || res.body.data.costPerUnit || res.body.data.privateCost) {
      throw new Error('Private production costs leaked in transaction payload');
    }
  });

  await test('14. Privacy protection — Chat messages not present in completion payload', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_fulfilled' }
    };
    const res = mockResponse();

    await completeTransaction(req, res, mockNext());

    if (res.body.data.messages || res.body.data.chatHistory) {
      throw new Error('Chat messages leaked in transaction payload');
    }
  });

  await test('15. Non-mutation rule — AI services (Gemini/Mary) cannot mutate transaction completion state', async () => {
    // Verify geminiService has no completion or state mutation methods
    const geminiKeys = Object.keys(geminiService);
    const mutationKeys = geminiKeys.filter(k => k.toLowerCase().includes('complete') || k.toLowerCase().includes('update') || k.toLowerCase().includes('mutate'));
    
    if (mutationKeys.length > 0) {
      throw new Error(`Gemini service contains potential mutation methods: ${mutationKeys.join(', ')}`);
    }
  });

  console.log('==========================================================================');
  console.log('✨ All 15 Transaction Completion verification tests PASSED successfully!\n');
}

runCompletionTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
