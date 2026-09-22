/**
 * Market Data Service — ShambaRecords Integration
 *
 * Implements IMarketDataProvider abstraction and ShambaRecords API integration.
 *
 * CRITICAL SECURITY & DECISION-SUPPORT CONSTRAINTS:
 *  1. API credentials (SHAMBARECORDS_API_KEY, SHAMBARECORDS_API_SECRET) MUST NEVER be exposed to frontend code.
 *  2. All requests to ShambaRecords originate strictly from the backend.
 *  3. Market prices are informational reference estimates from ShambaRecords — NOT guaranteed rates.
 *  4. The system MUST NOT calculate selling recommendations ("Sell now", "Accept dealer", etc.).
 *  5. API failures are returned truthfully — NO fake fallback prices are seeded or fabricated.
 *  6. In-memory caching respects ShambaRecords rate limits.
 */

import crypto from 'crypto';
import MarketPrice, { MarketDataSource, IMarketPrice } from '../models/MarketPrice';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NormalizedMarketPrice {
  externalId?:      string;
  provider:         string;
  cropName:         string;
  market:           string;
  county?:          string;
  price?:           number;
  minimumPrice?:    number;
  maximumPrice?:    number;
  unit:             string;
  currency:         string;
  source:           MarketDataSource;
  qualityGrade?:    string;
  notes?:           string;
  recordedAt:       Date;
  fetchedAt:        Date;
}

export interface MarketPriceSearchFilter {
  cropName?:  string;
  county?:    string;
  market?:    string;
  startDate?: Date | string;
  endDate?:   Date | string;
}

// ── Provider Interface ────────────────────────────────────────────────────────

export interface IMarketDataProvider {
  readonly providerName: string;

  getLatestPrices(): Promise<NormalizedMarketPrice[]>;
  searchPrices(filter: MarketPriceSearchFilter): Promise<NormalizedMarketPrice[]>;
}

// ── ShambaRecords Market Data Provider ──────────────────────────────────────

export class ShambaRecordsMarketDataProvider implements IMarketDataProvider {
  readonly providerName = 'ShambaRecords';

  private getBaseUrl(): string {
    return process.env.SHAMBARECORDS_BASE_URL || 'https://api-data.shambarecords.com';
  }

  private getApiKey(): string | undefined {
    return process.env.SHAMBARECORDS_API_KEY;
  }

  private getApiSecret(): string | undefined {
    return process.env.SHAMBARECORDS_API_SECRET;
  }

  private generateAuthHeaders(bodyPayload: string): Record<string, string> {
    const apiKey = this.getApiKey();
    const apiSecret = this.getApiSecret();

    if (!apiKey) {
      throw Object.assign(
        new Error('ShambaRecords API key is not configured. Set SHAMBARECORDS_API_KEY in environment.'),
        { statusCode: 503, code: 'CREDENTIALS_MISSING' }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Signature-Timestamp': timestamp,
    };

    if (apiSecret) {
      const signaturePayload = `${timestamp}.${bodyPayload}`;
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(signaturePayload)
        .digest('hex');
      headers['X-Signature'] = signature;
    }

    return headers;
  }

  /**
   * Helper to normalize raw ShambaRecords API item into internal NormalizedMarketPrice format
   */
  public normalizeItem(rawItem: any): NormalizedMarketPrice {
    if (!rawItem || typeof rawItem !== 'object') {
      throw new Error('Invalid raw market item format');
    }

    const cropName = rawItem.product_name || rawItem.crop_name || rawItem.commodity || 'General Produce';
    const market = rawItem.market_name || rawItem.market || 'Regional Market';
    const unit = rawItem.unit || rawItem.measurement_unit || 'kg';
    const currency = rawItem.currency || 'KES';
    const price = rawItem.price !== undefined && rawItem.price !== null ? Number(rawItem.price) : undefined;
    const minimumPrice = rawItem.min_price !== undefined && rawItem.min_price !== null ? Number(rawItem.min_price) : undefined;
    const maximumPrice = rawItem.max_price !== undefined && rawItem.max_price !== null ? Number(rawItem.max_price) : undefined;
    const county = rawItem.county || rawItem.region || rawItem.location;
    const externalId = rawItem.id || rawItem.price_id || rawItem.external_id ? String(rawItem.id || rawItem.price_id || rawItem.external_id) : undefined;
    const qualityGrade = rawItem.grade || rawItem.quality_grade;
    const notes = rawItem.notes || rawItem.description;

    const recordedAtRaw = rawItem.recorded_at || rawItem.created_at || rawItem.date;
    const recordedAt = recordedAtRaw ? new Date(recordedAtRaw) : new Date();

    return {
      externalId,
      provider: this.providerName,
      cropName: String(cropName).trim(),
      market: String(market).trim(),
      county: county ? String(county).trim() : undefined,
      price,
      minimumPrice,
      maximumPrice,
      unit: String(unit).trim(),
      currency: String(currency).trim(),
      source: MarketDataSource.SHAMBARECORDS,
      qualityGrade: qualityGrade ? String(qualityGrade).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      recordedAt,
      fetchedAt: new Date(),
    };
  }

  async getLatestPrices(): Promise<NormalizedMarketPrice[]> {
    const url = `${this.getBaseUrl()}/api/v1/prices/latest`;
    const bodyStr = JSON.stringify({});
    const headers = this.generateAuthHeaders(bodyStr);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: bodyStr,
      });

      if (response.status === 429) {
        throw Object.assign(
          new Error('ShambaRecords API rate limit exceeded. Please try again shortly.'),
          { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' }
        );
      }

      if (!response.ok) {
        throw Object.assign(
          new Error(`ShambaRecords API responded with HTTP status ${response.status}.`),
          { statusCode: response.status, code: 'EXTERNAL_API_ERROR' }
        );
      }

      const data = await response.json();
      const rawList = Array.isArray(data) ? data : data.prices || data.data || [];
      return rawList.map((item: any) => this.normalizeItem(item));
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw Object.assign(
        new Error(`Failed to fetch latest prices from ShambaRecords: ${err.message}`),
        { statusCode: 502, code: 'FETCH_FAILED' }
      );
    }
  }

  async searchPrices(filter: MarketPriceSearchFilter): Promise<NormalizedMarketPrice[]> {
    const url = `${this.getBaseUrl()}/api/v1/prices/search`;
    const payload = {
      product_name: filter.cropName,
      county: filter.county,
      market_name: filter.market,
      start_date: filter.startDate,
      end_date: filter.endDate,
    };
    const bodyStr = JSON.stringify(payload);
    const headers = this.generateAuthHeaders(bodyStr);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: bodyStr,
      });

      if (response.status === 429) {
        throw Object.assign(
          new Error('ShambaRecords API rate limit exceeded. Please try again shortly.'),
          { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' }
        );
      }

      if (!response.ok) {
        throw Object.assign(
          new Error(`ShambaRecords API search responded with HTTP status ${response.status}.`),
          { statusCode: response.status, code: 'EXTERNAL_API_ERROR' }
        );
      }

      const data = await response.json();
      const rawList = Array.isArray(data) ? data : data.prices || data.data || [];
      return rawList.map((item: any) => this.normalizeItem(item));
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw Object.assign(
        new Error(`Failed to search ShambaRecords prices: ${err.message}`),
        { statusCode: 502, code: 'FETCH_FAILED' }
      );
    }
  }
}

// ── Mock Market Data Provider for Testing / Unconfigured Environment ──────────

export class MockMarketDataProvider implements IMarketDataProvider {
  readonly providerName = 'ShambaRecords (Mock/Test)';

  private mockPrices: NormalizedMarketPrice[] = [
    {
      externalId: 'SR-MOCK-001',
      provider: 'ShambaRecords (Mock/Test)',
      cropName: 'Dry Maize',
      market: 'Wakulima Market, Nairobi',
      county: 'Nairobi',
      price: 3800,
      minimumPrice: 3600,
      maximumPrice: 4000,
      unit: '90kg bag',
      currency: 'KES',
      source: MarketDataSource.SHAMBARECORDS,
      qualityGrade: 'Grade 1',
      notes: 'High demand observed across urban markets.',
      recordedAt: new Date(),
      fetchedAt: new Date(),
    },
    {
      externalId: 'SR-MOCK-002',
      provider: 'ShambaRecords (Mock/Test)',
      cropName: 'Rosecoco Beans',
      market: 'Nyeri Open Market',
      county: 'Nyeri',
      price: 9200,
      minimumPrice: 9000,
      maximumPrice: 9500,
      unit: '90kg bag',
      currency: 'KES',
      source: MarketDataSource.SHAMBARECORDS,
      qualityGrade: 'Standard',
      notes: 'Steady supply from South Aberdares region.',
      recordedAt: new Date(),
      fetchedAt: new Date(),
    },
    {
      externalId: 'SR-MOCK-003',
      provider: 'ShambaRecords (Mock/Test)',
      cropName: 'Irish Potatoes',
      market: 'Nakuru Wholesale Market',
      county: 'Nakuru',
      price: 2400,
      minimumPrice: 2200,
      maximumPrice: 2600,
      unit: '50kg bag',
      currency: 'KES',
      source: MarketDataSource.SHAMBARECORDS,
      qualityGrade: 'Grade 1',
      recordedAt: new Date(),
      fetchedAt: new Date(),
    },
  ];

  async getLatestPrices(): Promise<NormalizedMarketPrice[]> {
    return this.mockPrices;
  }

  async searchPrices(filter: MarketPriceSearchFilter): Promise<NormalizedMarketPrice[]> {
    return this.mockPrices.filter((p) => {
      if (filter.cropName && !p.cropName.toLowerCase().includes(filter.cropName.toLowerCase())) {
        return false;
      }
      if (filter.county && !p.county?.toLowerCase().includes(filter.county.toLowerCase())) {
        return false;
      }
      if (filter.market && !p.market.toLowerCase().includes(filter.market.toLowerCase())) {
        return false;
      }
      return true;
    });
  }
}

// ── Active Provider Singleton & Caching Logic ─────────────────────────────────

let _activeProvider: IMarketDataProvider = new ShambaRecordsMarketDataProvider();

export function setMarketDataProvider(provider: IMarketDataProvider): void {
  _activeProvider = provider;
}

export function getMarketDataProvider(): IMarketDataProvider {
  return _activeProvider;
}

// Simple in-memory cache to prevent excessive requests & respect rate limits
interface CacheEntry {
  timestamp: number;
  data: NormalizedMarketPrice[];
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache
let latestPricesCache: CacheEntry | null = null;
const searchCache: Map<string, CacheEntry> = new Map();

/**
 * Service function to retrieve latest market prices
 */
export async function fetchLatestMarketPrices(forceRefresh = false): Promise<NormalizedMarketPrice[]> {
  const now = Date.now();
  if (!forceRefresh && latestPricesCache && now - latestPricesCache.timestamp < CACHE_TTL_MS) {
    return latestPricesCache.data;
  }

  const provider = getMarketDataProvider();
  const prices = await provider.getLatestPrices();

  // Cache normalized results
  latestPricesCache = { timestamp: now, data: prices };

  // Persist fetched entries asynchronously into MarketPrice collection without overwriting source metadata
  for (const item of prices) {
    try {
      await MarketPrice.updateOne(
        { externalId: item.externalId, provider: item.provider },
        {
          $set: {
            cropName: item.cropName,
            market: item.market,
            county: item.county,
            price: item.price,
            minimumPrice: item.minimumPrice,
            maximumPrice: item.maximumPrice,
            unit: item.unit,
            currency: item.currency,
            source: item.source,
            provider: item.provider,
            externalId: item.externalId,
            qualityGrade: item.qualityGrade,
            notes: item.notes,
            observedAt: item.recordedAt,
            retrievedAt: item.fetchedAt,
          },
        },
        { upsert: true }
      );
    } catch {
      // Non-blocking persistence error
    }
  }

  return prices;
}

/**
 * Service function to search market prices
 */
export async function searchMarketPrices(filter: MarketPriceSearchFilter): Promise<NormalizedMarketPrice[]> {
  const cacheKey = JSON.stringify(filter);
  const now = Date.now();

  const cached = searchCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const provider = getMarketDataProvider();
  const prices = await provider.searchPrices(filter);

  searchCache.set(cacheKey, { timestamp: now, data: prices });
  return prices;
}
