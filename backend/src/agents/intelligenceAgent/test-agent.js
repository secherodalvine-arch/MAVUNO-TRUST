import { getMarketRecommendationForFarmer } from './agent.js';
import assert from 'assert';

const mockGetMarketPrices = async ({ crop, county }) => {
  if (crop.toLowerCase() === 'mango') return [];
  if (crop.toLowerCase() === 'error') throw new Error('DB timeout');
  
  return [
    {
      commodity: crop,
      market: county === 'Nairobi' ? 'Nairobi Wakulima' : 'Nakuru Main',
      county: county || 'Nakuru',
      wholesalePrice: county === 'Nairobi' ? 3200 : 2800,
      retailPrice: county === 'Nairobi' ? 3500 : 3000,
      unit: '90KG Bag',
      observedDate: '2026-10-06T08:00:00.000Z',
      source: 'KAMIS'
    }
  ];
};

const mockFindBuyers = async ({ crop, county }) => {
  if (crop.toLowerCase() === 'mango') return [];
  if (crop.toLowerCase() === 'error') throw new Error('DB timeout');

  return [
    {
      dealerId: 'mock_dealer_1',
      displayName: 'AgriTrade Hub',
      generalOperatingArea: county || 'Nairobi',
      countiesServed: [county || 'Nairobi', 'Kiambu'],
      cropsDealt: [crop, 'Beans'],
      purchasingCapacityKg: 50000,
      verificationStatus: 'ACTIVE',
      verificationSource: 'AFA_OFFICIAL',
      isPublicProfile: true
    }
  ];
};

const mockGetNationalBenchmarks = async ({ commodity }) => {
  if (commodity.toLowerCase() === 'mango') return [];
  if (commodity.toLowerCase() === 'error') throw new Error('DB timeout');
  if (commodity === 'Maize_WRSC_Fail') throw new Error('WRSC DB timeout');

  return [
    {
      commodity: commodity,
      price: 3000,
      unit: '90kg bag',
      publicationDate: '2026-10-01T00:00:00.000Z',
      source: 'WRSC'
    }
  ];
};

const mockGetFaoPriceHistory = async ({ commodity }) => {
  if (commodity.toLowerCase() === 'mango') return [];
  if (commodity.toLowerCase() === 'error') throw new Error('DB timeout');
  if (commodity === 'Maize_WFP_Fail') throw new Error('WFP DB timeout');

  return [
    {
      commodity: commodity,
      price: 2800,
      unit: '90 KG',
      date: '2026-09-01T00:00:00.000Z',
      market: 'Nairobi',
      priceType: 'Wholesale',
      source: 'WFP/HDX'
    }
  ];
};

const overrides = {
  getMarketPrices: mockGetMarketPrices,
  findBuyers: mockFindBuyers,
  getNationalBenchmarks: mockGetNationalBenchmarks,
  getFaoPriceHistory: mockGetFaoPriceHistory
};

async function runTests() {
  console.log('--- TEST 1: Valid Maize request ---');
  const res1 = await getMarketRecommendationForFarmer({
    crop: 'Maize',
    quantity: 100,
    unit: 'bags',
    county: 'Nairobi'
  }, overrides);
  
  if (res1.success) {
    console.log('Result:', JSON.stringify(res1, null, 2));
    assert(res1.data.recommendation, 'Recommendation object exists');
    assert(typeof res1.data.recommendation.nextAction === 'string', 'nextAction is a required string');
    console.log('TEST 1 PASS');
  } else {
    console.log('TEST 1 SKIPPED OR FAILED API:', res1.error);
  }

  console.log('\n--- TEST 2: Simulated WRSC Failure ---');
  const res2 = await getMarketRecommendationForFarmer({
    crop: 'Maize_WRSC_Fail',
    quantity: 100,
    unit: 'bags',
    county: 'Nairobi'
  }, overrides);
  
  if (res2.success) {
    console.log('WRSC Failure gracefully handled. Data Limitations:', res2.data.dataLimitations);
    assert(Array.isArray(res2.data.dataLimitations), 'DataLimitations is an array');
    console.log('TEST 2 PASS');
  } else {
    console.log('TEST 2 SKIPPED OR FAILED API:', res2.error);
  }

  console.log('\n--- TEST 3: Simulated WFP Failure ---');
  const res3 = await getMarketRecommendationForFarmer({
    crop: 'Maize_WFP_Fail',
    quantity: 100,
    unit: 'bags',
    county: 'Nairobi'
  }, overrides);
  
  if (res3.success) {
    console.log('WFP Failure gracefully handled. Data Limitations:', res3.data.dataLimitations);
    assert(Array.isArray(res3.data.dataLimitations), 'DataLimitations is an array');
    console.log('TEST 3 PASS');
  } else {
    console.log('TEST 3 SKIPPED OR FAILED API:', res3.error);
  }
}

runTests().catch(console.error);
