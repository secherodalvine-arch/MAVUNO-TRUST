import dotenv from 'dotenv';
import { ShambaRecordsMarketDataProvider } from '../services/marketDataService';

dotenv.config({ path: '.env' }); // Current working directory is backend

async function testApi() {
  console.log('Testing ShambaRecords API...');
  console.log('Key present?', !!process.env.SHAMBARECORDS_API_KEY);
  console.log('Secret present?', !!process.env.SHAMBARECORDS_API_SECRET);
  
  const provider = new ShambaRecordsMarketDataProvider();
  try {
    const latest = await provider.getLatestPrices();
    console.log('Latest prices count:', latest.length);
    if (latest.length > 0) {
      console.log('Sample item (no keys exposed):');
      console.log(JSON.stringify(latest[0], null, 2));
    }
  } catch (error: any) {
    console.error('Error fetching latest prices:', error.message);
  }
}

testApi();
