import MarketData from '../models/MarketData.js';
import { syncWorker } from '../agents/mavunoagent/index.js';

const MARKET_DISCLAIMER = 'Current agricultural market observations for informational reference. Prices may vary by market, grade, and transaction terms.';

/**
 * GET /api/market-prices
 * Read-only endpoint for farmer-facing market price observations.
 * Supports filters: commodity, county, market, priceType, limit, page
 */
export const getMarketPrices = async (req, res, next) => {
  try {
    const { commodity, county, market, priceType, limit = 50, page = 1 } = req.query;

    const query = {};

    if (commodity && typeof commodity === 'string' && commodity.trim() !== '') {
      query.commodity = { $regex: new RegExp(commodity.trim(), 'i') };
    }

    if (county && typeof county === 'string' && county.trim() !== '') {
      query.county = { $regex: new RegExp(county.trim(), 'i') };
    }

    if (market && typeof market === 'string' && market.trim() !== '') {
      query.market = { $regex: new RegExp(market.trim(), 'i') };
    }

    if (priceType === 'wholesale') {
      query.wholesalePrice = { $ne: null, $gte: 0 };
    } else if (priceType === 'retail') {
      query.retailPrice = { $ne: null, $gte: 0 };
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    let records = [];
    let total = 0;

    try {
      [records, total] = await Promise.all([
        MarketData.find(query).sort({ observedDate: -1, createdAt: -1 }).skip(skip).limit(parsedLimit).lean(),
        MarketData.countDocuments(query),
      ]);

      // If database has 0 records, trigger MavunoAgent to extract & populate initial market prices
      if (records.length === 0 && !commodity && !county && !market) {
        await syncWorker.runSync();
        [records, total] = await Promise.all([
          MarketData.find(query).sort({ observedDate: -1, createdAt: -1 }).skip(skip).limit(parsedLimit).lean(),
          MarketData.countDocuments(query),
        ]);
      }
    } catch (dbErr) {
      records = [];
      total = 0;
    }

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit) || 1,
        },
        source: 'MavunoAgent',
        disclaimer: MARKET_DISCLAIMER,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getKamisMarketPrices = getMarketPrices;
