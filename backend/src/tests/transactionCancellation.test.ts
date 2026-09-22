import mongoose from 'mongoose';
import { Request } from 'express';
import { cancelTransaction, getTransactionById } from '../controllers/transactionController';
import Transaction, { TransactionStatus, FulfilmentStatus, CancellationReason } from '../models/Transaction';
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

async function runCancellationTestSuite() {
  console.log('\n🚫 MavunoTrust Transaction Cancellation Verification Suite');
  console.log('==========================================================================');

  const farmerId = new mongoose.Types.ObjectId().toHexString();
  const dealerId = new mongoose.Types.ObjectId().toHexString();
  const unrelatedUserId = new mongoose.Types.ObjectId().toHexString();

  const resetDb = () => {
    mockDb = [
      {
        _id: 'tx_agreed',
        farmerId,
        dealerId,
        listingId: 'listing_1',
        acceptedOfferId: 'offer_1',
        cropName: 'Tomatoes',
        quantity: 100,
        unit: 'crate',
        agreedPricePerUnit: 1200,
        totalAgreedValue: 120000,
        currency: 'KES',
        status: TransactionStatus.AGREED,
        fulfilment: {
          status: FulfilmentStatus.PENDING
        },
        agreementDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'tx_in_progress',
        farmerId,
        dealerId,
        listingId: 'listing_2',
        acceptedOfferId: 'offer_2',
        cropName: 'Onions',
        quantity: 500,
        unit: 'kg',
        agreedPricePerUnit: 80,
        totalAgreedValue: 40000,
        currency: 'KES',
        status: TransactionStatus.IN_PROGRESS,
        fulfilment: {
          status: FulfilmentStatus.IN_PROGRESS,
          method: 'Dealer Pickup'
        },
        agreementDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'tx_fulfilled',
        farmerId,
        dealerId,
        listingId: 'listing_3',
        acceptedOfferId: 'offer_3',
        cropName: 'Potatoes',
        quantity: 200,
        unit: 'bag',
        agreedPricePerUnit: 2500,
        totalAgreedValue: 500000,
        currency: 'KES',
        status: TransactionStatus.IN_PROGRESS,
        fulfilment: {
          status: FulfilmentStatus.FULFILLED,
          actualFulfilmentDate: new Date()
        },
        agreementDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'tx_completed',
        farmerId,
        dealerId,
        listingId: 'listing_4',
        acceptedOfferId: 'offer_4',
        cropName: 'Maize',
        quantity: 1000,
        unit: 'kg',
        agreedPricePerUnit: 45,
        totalAgreedValue: 45000,
        currency: 'KES',
        status: TransactionStatus.COMPLETED,
        completedAt: new Date('2026-09-20T10:00:00Z'),
        completedBy: farmerId,
        fulfilment: {
          status: FulfilmentStatus.FULFILLED
        },
        agreementDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'tx_already_cancelled',
        farmerId,
        dealerId,
        listingId: 'listing_5',
        acceptedOfferId: 'offer_5',
        cropName: 'Cabbage',
        quantity: 300,
        unit: 'head',
        agreedPricePerUnit: 50,
        totalAgreedValue: 15000,
        currency: 'KES',
        status: TransactionStatus.CANCELLED,
        cancelledAt: new Date('2026-09-21T08:00:00Z'),
        cancelledBy: dealerId,
        cancellationReason: CancellationReason.MUTUAL_AGREEMENT,
        cancellationNote: 'Original cancellation note',
        agreementDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  };

  resetDb();

  await test('1. Controller export cancelTransaction is defined', () => {
    if (typeof cancelTransaction !== 'function') {
      throw new Error('cancelTransaction function is not exported');
    }
  });

  await test('2. Successful cancellation by Farmer when transaction is AGREED', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed' },
      body: {
        cancellationReason: CancellationReason.MUTUAL_AGREEMENT,
        cancellationNote: 'Agreed mutually to stop transaction'
      }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    if (res.body.data.status !== TransactionStatus.CANCELLED) {
      throw new Error(`Expected CANCELLED status, got ${res.body.data.status}`);
    }
    if (res.body.data.cancelledBy !== farmerId) {
      throw new Error(`Expected cancelledBy to be farmerId, got ${res.body.data.cancelledBy}`);
    }
    if (res.body.data.cancellationReason !== CancellationReason.MUTUAL_AGREEMENT) {
      throw new Error(`Expected MUTUAL_AGREEMENT reason, got ${res.body.data.cancellationReason}`);
    }
    if (!res.body.data.cancelledAt) {
      throw new Error('Expected cancelledAt timestamp');
    }
  });

  await test('3. Successful cancellation by Dealer when transaction is IN_PROGRESS', async () => {
    resetDb();
    const req: any = {
      user: { userId: dealerId },
      params: { id: 'tx_in_progress' },
      body: {
        cancellationReason: CancellationReason.DELIVERY_ISSUE,
        cancellationNote: 'Transport unavailable'
      }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    if (res.body.data.status !== TransactionStatus.CANCELLED) {
      throw new Error(`Expected CANCELLED status, got ${res.body.data.status}`);
    }
    if (res.body.data.cancelledBy !== dealerId) {
      throw new Error(`Expected cancelledBy to be dealerId, got ${res.body.data.cancelledBy}`);
    }
  });

  await test('4. Blocked 403 Forbidden for unauthorized user attempting cancellation', async () => {
    resetDb();
    const req: any = {
      user: { userId: unrelatedUserId },
      params: { id: 'tx_agreed' },
      body: { cancellationReason: CancellationReason.MUTUAL_AGREEMENT }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.statusCode}`);
    }
  });

  await test('5. Blocked 401 Unauthorized for unauthenticated request', async () => {
    resetDb();
    const req: any = {
      params: { id: 'tx_agreed' },
      body: { cancellationReason: CancellationReason.MUTUAL_AGREEMENT }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${res.statusCode}`);
    }
  });

  await test('6. AGREED transaction can be cancelled', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed' },
      body: { cancellationReason: CancellationReason.CHANGE_OF_CIRCUMSTANCES }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 200 || res.body.data.status !== TransactionStatus.CANCELLED) {
      throw new Error('AGREED transaction cancellation failed');
    }
  });

  await test('7. IN_PROGRESS transaction can be cancelled', async () => {
    resetDb();
    const req: any = {
      user: { userId: dealerId },
      params: { id: 'tx_in_progress' },
      body: { cancellationReason: CancellationReason.OTHER, cancellationNote: 'Personal reason' }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 200 || res.body.data.status !== TransactionStatus.CANCELLED) {
      throw new Error('IN_PROGRESS transaction cancellation failed');
    }
  });

  await test('8. COMPLETED transaction cannot be cancelled (400 Bad Request)', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_completed' },
      body: { cancellationReason: CancellationReason.MUTUAL_AGREEMENT }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
    }
    if (!res.body.error.message.includes('Completed transactions cannot be cancelled')) {
      throw new Error(`Unexpected error message: ${res.body.error.message}`);
    }
  });

  await test('9. FULFILLED transaction cannot be directly cancelled (400 Bad Request referring to dispute/remedy)', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_fulfilled' },
      body: { cancellationReason: CancellationReason.DELIVERY_ISSUE }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
    }
    if (!res.body.error.message.toLowerCase().includes('fulfilled')) {
      throw new Error(`Expected error message to mention fulfilled, got: ${res.body.error.message}`);
    }
  });

  await test('10. Idempotency: Already CANCELLED transaction returns 200 OK without overwriting original cancellation audit logs', async () => {
    resetDb();
    const originalCancelledAt = mockDb[4].cancelledAt;
    const originalCancelledBy = mockDb[4].cancelledBy;
    const originalReason = mockDb[4].cancellationReason;

    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_already_cancelled' },
      body: { cancellationReason: CancellationReason.OTHER, cancellationNote: 'Attempt to overwrite' }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200 OK, got ${res.statusCode}`);
    }
    if (!res.body.message.includes('already cancelled')) {
      throw new Error(`Expected already cancelled message, got: ${res.body.message}`);
    }
    if (res.body.data.cancellationReason !== originalReason) {
      throw new Error('Original cancellation reason was overwritten!');
    }
    if (res.body.data.cancelledBy !== originalCancelledBy) {
      throw new Error('Original cancelledBy actor was overwritten!');
    }
  });

  await test('11. Cancellation reason is required (missing reason returns 400 Bad Request)', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed' },
      body: {}
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
    }
  });

  await test('12. Invalid cancellation reason is rejected (returns 400 Bad Request)', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed' },
      body: { cancellationReason: 'INVALID_REASON_CODE' }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
    }
  });

  await test('13. Server-side timestamp cancelledAt generated automatically', async () => {
    resetDb();
    const beforeTime = new Date().getTime();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed' },
      body: { cancellationReason: CancellationReason.MUTUAL_AGREEMENT }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    const cancelledAtTime = new Date(res.body.data.cancelledAt).getTime();
    if (cancelledAtTime < beforeTime) {
      throw new Error('cancelledAt timestamp was not generated server-side');
    }
  });

  await test('14. Server-side actor ID cancelledBy derived from authenticated JWT user', async () => {
    resetDb();
    const req: any = {
      user: { userId: dealerId },
      params: { id: 'tx_agreed' },
      body: {
        cancellationReason: CancellationReason.MUTUAL_AGREEMENT,
        cancelledBy: farmerId // Client trying to spoof actor ID
      }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.body.data.cancelledBy !== dealerId) {
      throw new Error(`Expected cancelledBy to equal JWT user (${dealerId}), got ${res.body.data.cancelledBy}`);
    }
  });

  await test('15. completedAt and completedBy are preserved when cancellation fails on completed transaction', async () => {
    resetDb();
    const originalCompletedAt = mockDb[3].completedAt;
    const originalCompletedBy = mockDb[3].completedBy;

    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_completed' },
      body: { cancellationReason: CancellationReason.MUTUAL_AGREEMENT }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (mockDb[3].completedAt !== originalCompletedAt || mockDb[3].completedBy !== originalCompletedBy) {
      throw new Error('completedAt or completedBy was corrupted during failed cancellation attempt');
    }
  });

  await test('16. Strict boundary — No payment records or refund fields created during cancellation', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed' },
      body: { cancellationReason: CancellationReason.MUTUAL_AGREEMENT }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    const data = res.body.data;
    if (data.payment || data.refund || data.escrow || data.mpesaReceipt || data.paymentStatus) {
      throw new Error('Payment/Refund/Escrow fields detected in cancelled transaction payload!');
    }
  });

  await test('17. Privacy protection — Production costs not present in cancellation payload', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed' },
      body: { cancellationReason: CancellationReason.MUTUAL_AGREEMENT }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.body.data.productionCost || res.body.data.costPerUnit || res.body.data.privateCost) {
      throw new Error('Private production costs leaked in transaction payload');
    }
  });

  await test('18. Privacy protection — Chat messages not present in cancellation payload', async () => {
    resetDb();
    const req: any = {
      user: { userId: farmerId },
      params: { id: 'tx_agreed' },
      body: { cancellationReason: CancellationReason.MUTUAL_AGREEMENT }
    };
    const res = mockResponse();

    await cancelTransaction(req, res, mockNext());

    if (res.body.data.messages || res.body.data.chatHistory) {
      throw new Error('Chat messages leaked in transaction payload');
    }
  });

  await test('19. Non-mutation rule — AI services (Gemini/Mary) cannot mutate transaction cancellation state', async () => {
    const geminiKeys = Object.keys(geminiService);
    const mutationKeys = geminiKeys.filter(k => k.toLowerCase().includes('cancel') || k.toLowerCase().includes('update') || k.toLowerCase().includes('mutate'));
    
    if (mutationKeys.length > 0) {
      throw new Error(`Gemini service contains potential mutation methods: ${mutationKeys.join(', ')}`);
    }
  });

  console.log('==========================================================================');
  console.log('✨ All 19 Transaction Cancellation verification tests PASSED successfully!\n');
}

runCancellationTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
