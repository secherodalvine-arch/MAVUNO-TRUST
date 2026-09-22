/**
 * Market Data Service Test Suite — ShambaRecords Integration
 *
 * Tests provider contract, ShambaRecords payload normalization, search filtering,
 * rate limit handling, missing credentials, secret concealment, and auth guards.
 *
 * Run with: npm run test:market
 */

import {
  IMarketDataProvider,
  ShambaRecordsMarketDataProvider,
  MockMarketDataProvider,
  setMarketDataProvider,
  fetchLatestMarketPrices,
  searchMarketPrices,
  NormalizedMarketPrice,
} from '../services/marketDataService';
import { MarketDataSource } from '../models/MarketPrice';
import { requireAuth } from '../middleware/requireAuth';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: message });
    console.log(`  ✗ ${name}`);
    console.log(`    → ${message}`);
  }
}

async function runTests() {
  console.log('\n📊 MavunoTrust Market Data Test Suite (ShambaRecords Integration)');
  console.log('==================================================================');

  // Register mock provider for isolated testing
  const mockProvider = new MockMarketDataProvider();
  setMarketDataProvider(mockProvider);

  // Test 1: IMarketDataProvider Contract & Mock Latest Price Retrieval
  await test('Provider Contract — Mock provider returns normalized market prices', async () => {
    const prices = await fetchLatestMarketPrices(true);
    if (!Array.isArray(prices) || prices.length === 0) {
      throw new Error('Expected array of prices');
    }
    const maize = prices.find((p) => p.cropName === 'Dry Maize');
    if (!maize) throw new Error('Dry Maize record missing');
    if (maize.price !== 3800) throw new Error(`Price mismatch: expected 3800, got ${maize.price}`);
    if (maize.source !== MarketDataSource.SHAMBARECORDS) throw new Error('Source must be SHAMBARECORDS');
  });

  // Test 2: Search Filtering
  await test('Search Filtering — Filters market prices by crop name and county', async () => {
    const nteriBeans = await searchMarketPrices({ cropName: 'Beans', county: 'Nyeri' });
    if (nteriBeans.length !== 1) throw new Error(`Expected 1 result, got ${nteriBeans.length}`);
    if (nteriBeans[0].cropName !== 'Rosecoco Beans') throw new Error('Crop name mismatch');

    const emptySearch = await searchMarketPrices({ cropName: 'NonExistentCrop' });
    if (emptySearch.length !== 0) throw new Error('Expected 0 results for non-existent crop');
  });

  // Test 3: Response Normalization
  await test('Normalization — Normalizes raw ShambaRecords payload into internal format', () => {
    const provider = new ShambaRecordsMarketDataProvider();
    const rawPayload = {
      id: 'SR-10022',
      product_name: 'Yellow Maize',
      market_name: 'Eldoret Grain Market',
      county: 'Uasin Gishu',
      price: 3400,
      min_price: 3200,
      max_price: 3600,
      unit: '90kg bag',
      currency: 'KES',
      grade: 'Grade A',
      notes: 'Plentiful supply post-harvest.',
      recorded_at: '2026-09-20T10:00:00Z',
    };

    const norm = provider.normalizeItem(rawPayload);
    if (norm.externalId !== 'SR-10022') throw new Error('externalId mismatch');
    if (norm.cropName !== 'Yellow Maize') throw new Error('cropName mismatch');
    if (norm.market !== 'Eldoret Grain Market') throw new Error('market mismatch');
    if (norm.county !== 'Uasin Gishu') throw new Error('county mismatch');
    if (norm.price !== 3400) throw new Error('price mismatch');
    if (norm.qualityGrade !== 'Grade A') throw new Error('grade mismatch');
    if (norm.source !== MarketDataSource.SHAMBARECORDS) throw new Error('source mismatch');
  });

  // Test 4: Missing Credentials Handling
  await test('Security / Error Handling — Missing API key throws 503 CREDENTIALS_MISSING', async () => {
    const realProvider = new ShambaRecordsMarketDataProvider();
    const originalKey = process.env.SHAMBARECORDS_API_KEY;
    delete process.env.SHAMBARECORDS_API_KEY;

    let caught = false;
    try {
      await realProvider.getLatestPrices();
    } catch (err: any) {
      if (err.statusCode === 503 && err.code === 'CREDENTIALS_MISSING') {
        caught = true;
      }
    } finally {
      process.env.SHAMBARECORDS_API_KEY = originalKey;
    }

    if (!caught) throw new Error('Missing API key did not throw expected 503 CREDENTIALS_MISSING error');
  });

  // Test 5: Secret Concealment
  await test('Security — Secrets (API Key & Secret) are never exposed in normalized market price objects', async () => {
    const prices = await fetchLatestMarketPrices(true);
    for (const p of prices) {
      const jsonStr = JSON.stringify(p);
      if (jsonStr.includes('SHAMBARECORDS_API_KEY') || jsonStr.includes('SHAMBARECORDS_API_SECRET')) {
        throw new Error('API Secret leaked in normalized price payload!');
      }
      if ((p as any).apiKey || (p as any).apiSecret) {
        throw new Error('API credentials present on normalized object!');
      }
    }
  });

  // Test 6: Authentication Guard
  await test('Security — requireAuth blocks unauthenticated market requests', () => {
    const req: any = { headers: {} };
    let code = 0;
    let resJson: any = null;
    const res: any = {
      status(c: number) { code = c; return this; },
      json(d: any) { resJson = d; },
    };

    requireAuth(req, res, () => {});
    if (code !== 401) throw new Error(`Expected 401 status, got ${code}`);
    if (!resJson?.error?.message?.includes('Authentication required')) {
      throw new Error('Expected auth required error message');
    }
  });

  // Test 7: Truthful Error Handling (No fake fallback seeding)
  await test('Truthfulness — API errors throw clean exceptions without seeding fake data', async () => {
    class FailingProvider implements IMarketDataProvider {
      readonly providerName = 'FailingShambaRecords';
      async getLatestPrices(): Promise<NormalizedMarketPrice[]> {
        throw Object.assign(new Error('ShambaRecords service unavailable'), { statusCode: 502 });
      }
      async searchPrices(): Promise<NormalizedMarketPrice[]> {
        throw Object.assign(new Error('ShambaRecords search failed'), { statusCode: 502 });
      }
    }

    setMarketDataProvider(new FailingProvider());
    let caught = false;
    try {
      await fetchLatestMarketPrices(true);
    } catch (err: any) {
      if (err.statusCode === 502) caught = true;
    }
    setMarketDataProvider(mockProvider); // Restore mock

    if (!caught) throw new Error('Failing provider did not throw truthful 502 error');
  });

  // Summary
  console.log('\n==================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`Results: ${passedCount}/${results.length} tests passed.\n`);

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
