import mongoose from 'mongoose';
import { Request } from 'express';
import { getTransactionById, updateFulfilment } from '../controllers/transactionController';
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
  const res: any = {};
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

async function runFulfilmentTestSuite() {
  console.log('\n📦 MavunoTrust Transaction Delivery / Fulfilment Verification Suite');
  console.log('==========================================================================');

  const farmerId = new mongoose.Types.ObjectId().toHexString();
  const dealerId = new mongoose.Types.ObjectId().toHexString();
  const unrelatedUserId = new mongoose.Types.ObjectId().toHexString();
  const txId = new mongoose.Types.ObjectId().toHexString();

  // Seed test transaction
  const initialTx = {
    _id: txId,
    farmerId,
    dealerId,
    listingId: new mongoose.Types.ObjectId().toHexString(),
    acceptedOfferId: new mongoose.Types.ObjectId().toHexString(),
    cropName: 'Potatoes',
    quantity: 200,
    unit: 'bag',
    agreedPricePerUnit: 2500,
    totalAgreedValue: 500000,
    currency: 'KES',
    agreementDate: new Date(),
    status: TransactionStatus.AGREED,
    fulfilment: {
      status: FulfilmentStatus.PENDING,
      expectedDate: new Date('2026-10-01'),
      method: 'Dealer Pickup',
      notes: 'Pickup at main farm gate'
    }
  };

  mockDb = [initialTx];

  await test('1. Authorized farmer can view fulfilment information.', async () => {
    const req = { user: { userId: farmerId }, params: { id: txId } } as unknown as Request;
    const res = mockResponse();
    await getTransactionById(req, res, mockNext());

    if (!res.body?.success || !res.body?.data?.fulfilment) {
      throw new Error('Authorized farmer failed to view fulfilment details');
    }
    if (res.body.data.fulfilment.status !== FulfilmentStatus.PENDING) {
      throw new Error('Fulfilment status mismatch');
    }
  });

  await test('2. Authorized dealer can view fulfilment information.', async () => {
    const req = { user: { userId: dealerId }, params: { id: txId } } as unknown as Request;
    const res = mockResponse();
    await getTransactionById(req, res, mockNext());

    if (!res.body?.success || !res.body?.data?.fulfilment) {
      throw new Error('Authorized dealer failed to view fulfilment details');
    }
  });

  await test('3. Unrelated user cannot view fulfilment (403 Forbidden).', async () => {
    const req = { user: { userId: unrelatedUserId }, params: { id: txId } } as unknown as Request;
    const res = mockResponse();
    await getTransactionById(req, res, mockNext());

    if (res.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.statusCode}`);
    }
  });

  await test('4. Authorized participant can update permitted fulfilment information.', async () => {
    const req = {
      user: { userId: farmerId },
      params: { id: txId },
      body: {
        status: 'IN_PROGRESS',
        method: 'Farmer Direct Delivery',
        notes: 'Driver dispatched'
      }
    } as unknown as Request;
    const res = mockResponse();
    await updateFulfilment(req, res, mockNext());

    if (!res.body?.success || res.body?.data?.fulfilment?.status !== 'IN_PROGRESS') {
      throw new Error(`Authorized update failed. Got body: ${JSON.stringify(res.body)}`);
    }
    if (res.body.data.fulfilment.method !== 'Farmer Direct Delivery') {
      throw new Error('Fulfilment method did not update');
    }
  });

  await test('5. Unrelated user cannot update fulfilment (403 Forbidden).', async () => {
    const req = {
      user: { userId: unrelatedUserId },
      params: { id: txId },
      body: { status: 'FULFILLED' }
    } as unknown as Request;
    const res = mockResponse();
    await updateFulfilment(req, res, mockNext());

    if (res.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.statusCode}`);
    }
  });

  await test('6. Invalid transaction ID is handled correctly (404 Not Found).', async () => {
    const bogusId = new mongoose.Types.ObjectId().toHexString();
    const req = {
      user: { userId: farmerId },
      params: { id: bogusId },
      body: { status: 'IN_PROGRESS' }
    } as unknown as Request;
    const res = mockResponse();
    await updateFulfilment(req, res, mockNext());

    if (res.statusCode !== 404) {
      throw new Error(`Expected 404 Not Found, got ${res.statusCode}`);
    }
  });

  await test('7. Invalid fulfilment status is rejected (400 Bad Request).', async () => {
    const req = {
      user: { userId: farmerId },
      params: { id: txId },
      body: { status: 'INVALID_STATUS_NAME' }
    } as unknown as Request;
    const res = mockResponse();
    await updateFulfilment(req, res, mockNext());

    if (res.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request for invalid status, got ${res.statusCode}`);
    }
  });

  await test('8. AGREED → IN_PROGRESS status transition works correctly.', async () => {
    // Reset status to AGREED
    mockDb[0].status = TransactionStatus.AGREED;

    const req = {
      user: { userId: dealerId },
      params: { id: txId },
      body: { status: 'IN_PROGRESS' }
    } as unknown as Request;
    const res = mockResponse();
    await updateFulfilment(req, res, mockNext());

    if (res.body?.data?.status !== TransactionStatus.IN_PROGRESS) {
      throw new Error(`Transaction status failed to transition to IN_PROGRESS, got ${res.body?.data?.status}`);
    }
  });

  await test('9. Fulfilment does NOT automatically create COMPLETED transaction status.', async () => {
    const req = {
      user: { userId: farmerId },
      params: { id: txId },
      body: { status: 'FULFILLED' }
    } as unknown as Request;
    const res = mockResponse();
    await updateFulfilment(req, res, mockNext());

    if (res.body?.data?.status === TransactionStatus.COMPLETED) {
      throw new Error('SECURITY VIOLATION: Fulfilment automatically set transaction status to COMPLETED!');
    }
    if (res.body?.data?.fulfilment?.status !== 'FULFILLED') {
      throw new Error('Fulfilment status was not updated to FULFILLED');
    }
  });

  await test('10. Fulfilment does NOT create payment records.', async () => {
    const req = { user: { userId: farmerId }, params: { id: txId } } as unknown as Request;
    const res = mockResponse();
    await getTransactionById(req, res, mockNext());

    const data = res.body.data;
    if (data.paymentStatus || data.paymentId || data.isPaid || data.paymentRecord) {
      throw new Error('VIOLATION: Payment record or payment field detected in fulfilment payload!');
    }
  });

  await test('11. Production costs are not returned through fulfilment APIs.', async () => {
    const req = { user: { userId: farmerId }, params: { id: txId } } as unknown as Request;
    const res = mockResponse();
    await getTransactionById(req, res, mockNext());

    const data = res.body.data;
    if (data.seedCost || data.fertilizerCost || data.labourCost || data.productionCosts) {
      throw new Error('PRIVACY VIOLATION: Private production costs returned in transaction fulfilment payload!');
    }
  });

  await test('12. Private chat content is not returned through fulfilment APIs.', async () => {
    const req = { user: { userId: farmerId }, params: { id: txId } } as unknown as Request;
    const res = mockResponse();
    await getTransactionById(req, res, mockNext());

    const data = res.body.data;
    if (data.messages || data.chatLogs || data.privateConversations) {
      throw new Error('PRIVACY VIOLATION: Private chat content returned in transaction fulfilment payload!');
    }
  });

  await test('13. Gemini/Mary cannot mutate fulfilment state through AI requests.', async () => {
    const proto = Object.getPrototypeOf(geminiService);
    const methods = Object.getOwnPropertyNames(proto);

    const mutationKeywords = ['updatefulfilment', 'markfulfilled', 'savetransaction', 'mutate'];
    for (const m of methods) {
      for (const kw of mutationKeywords) {
        if (m.toLowerCase().includes(kw)) {
          throw new Error(`SECURITY VIOLATION: GeminiService contains state mutation method '${m}'!`);
        }
      }
    }
  });

  console.log('==========================================================================');
  console.log('Results: All 13 fulfilment verification tests passed successfully.\n');
}

runFulfilmentTestSuite();
