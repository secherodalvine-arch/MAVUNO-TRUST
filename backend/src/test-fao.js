import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { runFAOSync } from './services/faoSyncWorker.js';
import FAOPriceHistory from './models/FAOPriceHistory.js';
import { getFaoPriceHistory, getMarketPrices, getNationalBenchmarks } from './mcp/tools/marketTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('--- FAO/WFP Historical Data Implementation Tests ---');
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavunotrust_test';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.\n');

    // [Test 1] HDX Metadata, CSV Parsing, Unit/Date/Price Type normalization
    console.log('[Test 1] Running FAO sync worker...');
    process.env.TEST_MODE = 'true';
    const syncResult = await runFAOSync();
    console.log('Sync result:', syncResult);

    // [Test 2] Duplicate prevention
    console.log('\n[Test 2] Re-running FAO sync to test duplicate prevention...');
    const initialCount = await FAOPriceHistory.countDocuments();
    await runFAOSync();
    const newCount = await FAOPriceHistory.countDocuments();
    console.log(`Initial count: ${initialCount}, New count: ${newCount}. Duplicates prevented: ${initialCount === newCount}`);

    // [Test 3] DB Fetch & historical record verification
    console.log('\n[Test 3] Fetching a sample FAO record directly from DB...');
    const sampleRecord = await FAOPriceHistory.findOne({ commodity: { $regex: /Maize/i } }).lean();
    console.log(sampleRecord);

    // [Test 4] MCP Tool response test
    console.log('\n[Test 4] Testing get_fao_price_history MCP tool...');
    const mcpResponse = await getFaoPriceHistory({ commodity: 'Maize', limit: 2 });
    console.log('MCP Response (Sample):', JSON.stringify(mcpResponse, null, 2));

    // [Test 5] KAMIS Regression Test
    console.log('\n[Test 5] Testing existing KAMIS MCP tool to ensure it still works...');
    const kamisResponse = await getMarketPrices({ limit: 1 });
    console.log('KAMIS Response (Sample):', JSON.stringify(kamisResponse, null, 2));

    // [Test 6] WRSC Regression Test
    console.log('\n[Test 6] Testing existing WRSC MCP tool to ensure it still works...');
    const wrscResponse = await getNationalBenchmarks({ limit: 1 });
    console.log('WRSC Response (Sample):', JSON.stringify(wrscResponse, null, 2));

  } catch (err) {
    console.error('Test suite failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB. Tests finished.');
  }
}

runTests();
