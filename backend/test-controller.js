import { getMarketRecommendation } from './src/controllers/aiController.js';

async function testController() {
  const cases = [
    { name: 'VALID 100', body: { crop: 'Maize', quantity: 100, county: 'Nairobi' } },
    { name: 'INVALID 0', body: { crop: 'Maize', quantity: 0, county: 'Nairobi' } },
    { name: 'INVALID -100', body: { crop: 'Maize', quantity: -100, county: 'Nairobi' } },
    { name: 'INVALID abc', body: { crop: 'Maize', quantity: 'abc', county: 'Nairobi' } },
    { name: 'INVALID null', body: { crop: 'Maize', quantity: null, county: 'Nairobi' } },
    { name: 'INVALID NaN', body: { crop: 'Maize', quantity: NaN, county: 'Nairobi' } },
    { name: 'INVALID Infinity', body: { crop: 'Maize', quantity: Infinity, county: 'Nairobi' } },
    { name: 'INVALID Missing crop', body: { quantity: 100, county: 'Nairobi' } }
  ];

  for (const c of cases) {
    const req = { body: c.body };
    let status = null;
    let json = null;
    const res = {
      status: (s) => { status = s; return res; },
      json: (j) => { json = j; return res; }
    };
    
    // Stub agent.js to prevent actual calls if validation passes
    // We just want to see if validation rejects it.
    // If it passes validation, it might crash since agent isn't mocked properly,
    // but we can catch it or observe it.
    
    try {
      // In this test, we don't mock agent.js, but if it's invalid, it should return 400 instantly.
      // If it's valid, it will call the real agent and return 200 or 500.
      await getMarketRecommendation(req, res);
      console.log(`${c.name} -> Status: ${status} | Message: ${json ? (json.message || (json.data ? 'Success' : '')) : ''}`);
    } catch (e) {
      console.log(`${c.name} -> Threw error: ${e.message}`);
    }
  }
}

testController();
