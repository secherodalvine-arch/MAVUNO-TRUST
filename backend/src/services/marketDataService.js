/**
 * Market Data Service — MavunoAgent Integration
 *
 * Sources agricultural market price information directly from database records
 * populated by MavunoAgent.
 */
import MarketPrice, { MarketDataSource } from '../models/MarketPrice.js';
import { syncWorker } from '../agents/mavunoagent/index.js';

export class MavunoAgentMarketDataProvider {
  providerName = 'MavunoAgent';

  async getLatestPrices() {
    try {
      let records = await MarketPrice.find().sort({ observedAt: -1, createdAt: -1 }).limit(50).lean();

      if (!records || records.length === 0) {
        // Data should be populated by the background scheduler.
        // We do not run synchronous scraping here to avoid API timeouts.
      }

      return records.map((r) => ({
        externalId: r._id ? String(r._id) : undefined,
        provider: this.providerName,
        cropName: r.cropName || 'General Produce',
        market: r.market || 'Regional Market',
        county: r.county || 'Kenya',
        price: r.price,
        minimumPrice: r.minimumPrice || r.price,
        maximumPrice: r.maximumPrice || r.price,
        unit: r.unit || 'KG',
        currency: r.currency || 'KES',
        source: MarketDataSource.OTHER,
        qualityGrade: r.qualityGrade,
        notes: r.notes,
        recordedAt: r.observedAt || new Date(),
        fetchedAt: r.retrievedAt || new Date(),
      }));
    } catch (err) {
      return [];
    }
  }

  async searchPrices(filter) {
    try {
      const query = {};
      if (filter.cropName) {
        query.cropName = { $regex: new RegExp(filter.cropName, 'i') };
      }
      if (filter.county) {
        query.county = { $regex: new RegExp(filter.county, 'i') };
      }
      if (filter.market) {
        query.market = { $regex: new RegExp(filter.market, 'i') };
      }

      let records = await MarketPrice.find(query).sort({ observedAt: -1, createdAt: -1 }).limit(50).lean();

      if ((!records || records.length === 0) && !filter.cropName && !filter.county && !filter.market) {
        // Data should be populated by the background scheduler.
      }

      return records.map((r) => ({
        externalId: r._id ? String(r._id) : undefined,
        provider: this.providerName,
        cropName: r.cropName || 'General Produce',
        market: r.market || 'Regional Market',
        county: r.county || 'Kenya',
        price: r.price,
        minimumPrice: r.minimumPrice || r.price,
        maximumPrice: r.maximumPrice || r.price,
        unit: r.unit || 'KG',
        currency: r.currency || 'KES',
        source: MarketDataSource.OTHER,
        qualityGrade: r.qualityGrade,
        notes: r.notes,
        recordedAt: r.observedAt || new Date(),
        fetchedAt: r.retrievedAt || new Date(),
      }));
    } catch (err) {
      return [];
    }
  }
}

let _activeProvider = new MavunoAgentMarketDataProvider();

export function setMarketDataProvider(provider) {
  _activeProvider = provider;
}

export function getMarketDataProvider() {
  return _activeProvider;
}

export async function fetchLatestMarketPrices(forceRefresh = false) {
  const provider = getMarketDataProvider();
  return await provider.getLatestPrices();
}

export async function searchMarketPrices(filter) {
  const provider = getMarketDataProvider();
  return await provider.searchPrices(filter);
}
