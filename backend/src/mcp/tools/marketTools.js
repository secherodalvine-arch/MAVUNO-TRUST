import MarketPrice from '../../models/MarketPrice.js';
import WRSCWeeklyPrice from '../../models/WRSCWeeklyPrice.js';
import FAOPriceHistory from '../../models/FAOPriceHistory.js';
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

  return prices.map(p => {
    let dataAgeDays = null;
    if (p.observedAt) {
      const msDiff = Date.now() - new Date(p.observedAt).getTime();
      dataAgeDays = Math.round(msDiff / (1000 * 60 * 60 * 24));
    }
    return {
      commodity: p.cropName,
      market: p.market,
      county: p.county,
      wholesalePrice: p.minimumPrice,
      retailPrice: p.maximumPrice,
      unit: p.unit,
      observedDate: p.observedAt ? p.observedAt.toISOString() : null,
      dataAgeDays,
      source: p.source,
      provider: p.provider,
      qualityGrade: p.qualityGrade || null,
    };
  });
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

export const getNationalBenchmarks = async ({ commodity, limit = 50 }) => {
  const query = {};
  if (commodity) {
    query.commodity = { $regex: new RegExp(commodity, 'i') };
  }

  // Find recent benchmarks, sorted by publication date descending
  const benchmarks = await WRSCWeeklyPrice.find(query)
    .sort({ publicationDate: -1 })
    .limit(limit)
    .lean();

  return benchmarks.map(b => {
    return {
      source: 'WRSC',
      dataType: 'weekly national benchmark',
      commodity: b.commodity,
      variety: b.variety,
      unit: b.unit,
      price: b.price,
      currency: b.currency,
      publicationDate: b.publicationDate ? b.publicationDate.toISOString() : null,
      postUrl: b.postUrl,
    };
  });
};

export const getFaoPriceHistory = async ({ commodity, market, startDate, endDate, limit = 100 }) => {
  const query = {};
  if (commodity) {
    query.commodity = { $regex: new RegExp(commodity, 'i') };
  }
  if (market) {
    query.market = { $regex: new RegExp(market, 'i') };
  }
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const history = await FAOPriceHistory.find(query)
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return history.map(h => {
    return {
      historicalContext: true,
      source: h.source,
      dataset: h.dataset,
      dataType: h.dataType,
      commodity: h.commodity,
      market: h.market,
      date: h.date ? h.date.toISOString() : null,
      value: h.value,
      unit: h.unit,
      currency: h.currency,
      priceType: h.priceType,
    };
  });
};
