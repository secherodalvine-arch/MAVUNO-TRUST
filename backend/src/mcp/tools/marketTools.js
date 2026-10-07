import MarketPrice from '../../models/MarketPrice.js';

export const getMarketPrices = async ({ crop, county, market, limit = 50 }) => {
  const query = {};
  if (crop) {
    // Case-insensitive regex search for crop name
    query.cropName = { $regex: new RegExp(crop, 'i') };
  }
  if (county) {
    query.county = { $regex: new RegExp(county, 'i') };
  }
  if (market) {
    query.market = { $regex: new RegExp(market, 'i') };
  }

  // Find recent prices, sorted by observation date descending
  const prices = await MarketPrice.find(query)
    .sort({ observedAt: -1 })
    .limit(limit)
    .lean();

  return prices.map(p => ({
    commodity: p.cropName,
    market: p.market,
    county: p.county,
    wholesalePrice: p.minimumPrice,
    retailPrice: p.maximumPrice,
    unit: p.unit,
    observedDate: p.observedAt ? p.observedAt.toISOString() : null,
    source: p.source,
    provider: p.provider,
    qualityGrade: p.qualityGrade || null,
  }));
};

export const getMarketDetails = async ({ market }) => {
  // Aggregate basic details about a market from the MarketPrice collection
  const query = { market: { $regex: new RegExp(market, 'i') } };
  
  const prices = await MarketPrice.find(query)
    .sort({ observedAt: -1 })
    .limit(100)
    .lean();
    
  if (!prices.length) {
    return {
      market,
      error: 'No data found for this market.',
    };
  }

  // Find the county
  const county = prices.find(p => p.county)?.county || 'Unknown';
  
  // Find distinct crops traded here recently
  const cropsSet = new Set(prices.map(p => p.cropName));
  const distinctCrops = Array.from(cropsSet);

  return {
    marketName: prices[0].market,
    county,
    recordedCrops: distinctCrops,
    recentObservationsCount: prices.length,
    latestObservationDate: prices[0].observedAt ? prices[0].observedAt.toISOString() : null,
  };
};
