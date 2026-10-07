import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getMarketPrices, getMarketDetails } from './tools/marketTools.js';
import { findBuyers, getDealerDetails } from './tools/dealerTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runTests() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavunotrust';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\n--- Testing getMarketPrices ---');
    const prices = await getMarketPrices({ crop: 'Maize', limit: 2 });
    console.log(JSON.stringify(prices, null, 2));

    console.log('\n--- Testing getMarketDetails ---');
    if (prices.length > 0) {
      const details = await getMarketDetails({ market: prices[0].market });
      console.log(JSON.stringify(details, null, 2));
    } else {
      console.log('No prices found to test market details.');
    }

    console.log('\n--- Testing findBuyers ---');
    const buyers = await findBuyers({ limit: 2 });
    console.log(JSON.stringify(buyers, null, 2));

    console.log('\n--- Testing getDealerDetails ---');
    if (buyers.length > 0) {
      const dealerDetails = await getDealerDetails({ dealerId: buyers[0].dealerId });
      console.log(JSON.stringify(dealerDetails, null, 2));
    } else {
      console.log('No buyers found to test dealer details.');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

runTests();
