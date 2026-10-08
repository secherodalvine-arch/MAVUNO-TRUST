import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { runWRSCSync } from './services/wrscSyncWorker.js';
import { getNationalBenchmarks, getMarketPrices } from './mcp/tools/marketTools.js';
import WRSCWeeklyPrice from './models/WRSCWeeklyPrice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('--- WRSC Implementation Tests ---');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavunotrust';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Test WRSC Synchronization
    console.log('\n[Test 1] Running WRSC sync worker...');
    const syncResult = await runWRSCSync();
    console.log('Sync result:', syncResult);

    // 2. Test fetching from WRSCWeeklyPrice
    console.log('\n[Test 2] Fetching a sample WRSC record directly from DB...');
    const record = await WRSCWeeklyPrice.findOne().sort({ publicationDate: -1 });
    console.log(record ? JSON.stringify(record, null, 2) : 'No records found.');

    // 3. Test duplicate prevention
    console.log('\n[Test 3] Re-running WRSC sync to test duplicate prevention...');
    const initialCount = await WRSCWeeklyPrice.countDocuments();
    await runWRSCSync();
    const newCount = await WRSCWeeklyPrice.countDocuments();
    console.log(`Initial count: ${initialCount}, New count: ${newCount}. Duplicates prevented: ${initialCount === newCount}`);

    // 4. Test new MCP Tool getNationalBenchmarks
    console.log('\n[Test 4] Testing getNationalBenchmarks MCP tool...');
    const benchmarks = await getNationalBenchmarks({ limit: 1 });
    console.log('MCP Response (Sample):', JSON.stringify(benchmarks, null, 2));
    
    // 5. Test existing KAMIS Tool getMarketPrices
    console.log('\n[Test 5] Testing existing getMarketPrices to ensure it still works...');
    const kamisPrices = await getMarketPrices({ limit: 1 });
    console.log('KAMIS MCP Response (Sample):', JSON.stringify(kamisPrices, null, 2));

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB. Tests finished.');
  }
}

runTests();
