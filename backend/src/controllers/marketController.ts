import { Request, Response, NextFunction } from 'express';
import * as marketDataService from '../services/marketDataService';

const MARKET_DISCLAIMER =
  'Market prices are reference information from the stated source and may differ by market, quality, quantity, timing and transaction terms. They are not a guaranteed price for your produce.';

export const getLatestMarketPrices = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const prices = await marketDataService.fetchLatestMarketPrices();
    res.json({
      success: true,
      data: {
        prices,
        disclaimer: MARKET_DISCLAIMER,
        source: 'ShambaRecords',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const searchMarketPrices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cropName = (req.query.cropName || req.body.cropName) as string | undefined;
    const county = (req.query.county || req.body.county) as string | undefined;
    const market = (req.query.market || req.body.market) as string | undefined;

    const prices = await marketDataService.searchMarketPrices({
      cropName: cropName?.trim(),
      county: county?.trim(),
      market: market?.trim(),
    });

    res.json({
      success: true,
      data: {
        prices,
        disclaimer: MARKET_DISCLAIMER,
        source: 'ShambaRecords',
      },
    });
  } catch (err) {
    next(err);
  }
};
