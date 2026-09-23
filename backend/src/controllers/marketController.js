import * as marketDataService from '../services/marketDataService.js';

const MARKET_DISCLAIMER = 'Market prices are reference information from MavunoAgent and may differ by market, quality, quantity, timing and transaction terms.';

export const getLatestMarketPrices = async (_req, res, next) => {
  try {
    const prices = await marketDataService.fetchLatestMarketPrices();
    res.json({
      success: true,
      data: {
        prices,
        disclaimer: MARKET_DISCLAIMER,
        source: 'MavunoAgent',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const searchMarketPrices = async (req, res, next) => {
  try {
    const cropName = req.query.cropName || req.body.cropName;
    const county = req.query.county || req.body.county;
    const market = req.query.market || req.body.market;
    const prices = await marketDataService.searchMarketPrices({
      cropName: typeof cropName === 'string' ? cropName.trim() : undefined,
      county: typeof county === 'string' ? county.trim() : undefined,
      market: typeof market === 'string' ? market.trim() : undefined,
    });
    res.json({
      success: true,
      data: {
        prices,
        disclaimer: MARKET_DISCLAIMER,
        source: 'MavunoAgent',
      },
    });
  } catch (err) {
    next(err);
  }
};
