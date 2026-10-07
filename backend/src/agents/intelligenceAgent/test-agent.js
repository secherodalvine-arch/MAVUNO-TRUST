import { getMarketRecommendationForFarmer } from './agent.js';

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

const overrides = {
  getMarketPrices: mockGetMarketPrices,
  findBuyers: mockFindBuyers
};

async function runTests() {
  console.log('--- TEST 1: Valid Maize request ---');
  const res1 = await getMarketRecommendationForFarmer({
    crop: 'Maize',
    quantity: 100,
    unit: 'bags',
    county: 'Nairobi'
  }, overrides);
  console.log('Result:', JSON.stringify(res1, null, 2));

  console.log('\n--- TEST 2: Crop with no available market data ---');
  const res2 = await getMarketRecommendationForFarmer({
    crop: 'Mango',
    quantity: 50,
    unit: 'kg',
    county: 'Machakos'
  }, overrides);
  console.log('Result:', JSON.stringify(res2, null, 2));

  console.log('\n--- TEST 3: MCP Tool failure ---');
  const res3 = await getMarketRecommendationForFarmer({
    crop: 'Error',
    quantity: 10,
    unit: 'kg',
    county: 'Nairobi'
  }, overrides);
  console.log('Result:', JSON.stringify(res3, null, 2));
}

runTests();
