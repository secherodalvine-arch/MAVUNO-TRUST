import dotenv from 'dotenv';
dotenv.config();

import { ShambaRecordsMarketDataProvider } from './src/services/marketDataService';

async function run() {
  console.log('SHAMBARECORDS_BASE_URL:', process.env.SHAMBARECORDS_BASE_URL ? 'PRESENT' : 'MISSING');
  console.log('SHAMBARECORDS_API_KEY:', process.env.SHAMBARECORDS_API_KEY ? 'PRESENT' : 'MISSING');
  console.log('SHAMBARECORDS_API_SECRET:', process.env.SHAMBARECORDS_API_SECRET ? 'PRESENT' : 'MISSING');

  const provider = new ShambaRecordsMarketDataProvider();
  try {
    const prices = await provider.getLatestPrices();
    console.log('SUCCESS');
    console.log('Fields:', Object.keys(prices[0] || {}));
  } catch (error: any) {
    console.log('FAILED');
    console.log('Error:', error.message);
  }
}

run();
