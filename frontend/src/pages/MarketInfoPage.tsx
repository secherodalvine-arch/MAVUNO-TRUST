import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, RefreshCw, AlertTriangle, Info, Calendar, MapPin, Package, Filter, ShieldCheck } from 'lucide-react';
import { marketDataService, type MarketDataItem } from '../services/marketDataService';
import { MarketTicker } from '../components/MarketTicker';
import { MarketPriceDetailModal } from '../components/MarketPriceDetailModal';
import LoadSpinner from '../components/LoadSpinner';
import '../styles/pages.css';

export const MarketInfoPage: React.FC = () => {
  const [tickerItems, setTickerItems] = useState<MarketDataItem[]>([]);
  const [prices, setPrices] = useState<MarketDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Form search states
  const [commodityQuery, setCommodityQuery] = useState('');
  const [marketQuery, setMarketQuery] = useState('');
  const [countyQuery, setCountyQuery] = useState('');
  const [priceTypeFilter, setPriceTypeFilter] = useState<'all' | 'wholesale' | 'retail'>('all');

  // Selected item modal state
  const [selectedItem, setSelectedItem] = useState<MarketDataItem | null>(null);

  useEffect(() => {
    fetchLatestData();
  }, []);

  const fetchLatestData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await marketDataService.getMarketPrices({ limit: 50 });
      const records = res.success && res.data?.records ? res.data.records : [];
      setTickerItems(records);
      setPrices(records);
    } catch {
      setError(true);
      setTickerItems([]);
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setHasSearched(true);
    try {
      const res = await marketDataService.getMarketPrices({
        commodity: commodityQuery.trim() || undefined,
        market: marketQuery.trim() || undefined,
        county: countyQuery.trim() || undefined,
        priceType: priceTypeFilter,
        limit: 50,
      });
      const records = res.success && res.data?.records ? res.data.records : [];
      setPrices(records);
    } catch {
      setError(true);
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon green">
          <TrendingUp size={22} />
        </div>
        <div>
          <h1 className="page-title">Market Prices</h1>
          <p className="page-subtitle">
            Current agricultural market observations extracted by MavunoAgent.
          </p>
          <div style={{ marginTop: '0.4rem' }}>
            <span className="kamis-source-badge">
              <ShieldCheck size={13} /> Source: MavunoAgent
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Moving Market Ticker */}
      {tickerItems.length > 0 && (
        <MarketTicker items={tickerItems} onSelect={(item) => setSelectedItem(item)} />
      )}

      {/* Search & Filter Form */}
      <div className="page-card page-card--spaced">
        <h2 className="section-heading">Search Market Prices</h2>
        <form onSubmit={handleSearch} className="page-form-grid">
          <div className="form-field">
            <label className="form-label" htmlFor="commodity-query">
              <Package size={14} /> Commodity
            </label>
            <input
              id="commodity-query"
              type="text"
              className="form-input"
              value={commodityQuery}
              onChange={(e) => setCommodityQuery(e.target.value)}
              placeholder="e.g. Tomatoes, Maize, Beans"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="market-query">
              <MapPin size={14} /> Market
            </label>
            <input
              id="market-query"
              type="text"
              className="form-input"
              value={marketQuery}
              onChange={(e) => setMarketQuery(e.target.value)}
              placeholder="e.g. Nairobi, Nakuru, Eldoret"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="county-query">
              <MapPin size={14} /> County
            </label>
            <input
              id="county-query"
              type="text"
              className="form-input"
              value={countyQuery}
              onChange={(e) => setCountyQuery(e.target.value)}
              placeholder="e.g. Nairobi, Uasin Gishu"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="price-type-filter">
              <Filter size={14} /> Price Type
            </label>
            <select
              id="price-type-filter"
              className="form-input"
              value={priceTypeFilter}
              onChange={(e) => setPriceTypeFilter(e.target.value as 'all' | 'wholesale' | 'retail')}
            >
              <option value="all">All Prices (Wholesale & Retail)</option>
              <option value="wholesale">Wholesale Prices Only</option>
              <option value="retail">Retail Prices Only</option>
            </select>
          </div>

          <div className="form-field form-field--actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Search size={16} /> Search Market Observations
            </button>
            <button type="button" onClick={fetchLatestData} disabled={loading} className="btn btn-outline">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && <LoadSpinner fullPage={false} size="md" text="Loading market observations…" />}

      {/* Error State */}
      {!loading && error && (
        <div className="state-card state-card--error">
          <AlertTriangle size={20} />
          <span className="state-title">Could not load market prices</span>
          <span className="state-desc">Please ensure the backend is running and try again.</span>
          <button className="btn btn-outline" onClick={fetchLatestData}>Retry</button>
        </div>
      )}

      {/* Search No Results State */}
      {!loading && !error && hasSearched && prices.length === 0 && (
        <div className="state-card">
          <Search size={24} />
          <span className="state-title">No matching observations found</span>
          <span className="state-desc">No market-price observation was found for this search.</span>
        </div>
      )}

      {/* Empty Database State — Render Reference Fallback observations so page is never blank */}
      {!loading && !error && !hasSearched && prices.length === 0 && (
        <div className="page-card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
          <TrendingUp size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
          <h3 className="section-heading" style={{ justifyContent: 'center' }}>Initializing Market Observations</h3>
          <p className="page-subtitle" style={{ maxWidth: '600px', margin: '0 auto 1.2rem auto' }}>
            MavunoAgent is continuously extracting agricultural market prices every 10 minutes. You can click below to trigger instant market extraction.
          </p>
          <button className="btn btn-primary" onClick={fetchLatestData} disabled={loading} style={{ margin: '0 auto' }}>
            <RefreshCw size={16} /> Trigger Instant MavunoAgent Sync
          </button>
        </div>
      )}

      {/* Observation Results Grid */}
      {!loading && !error && prices.length > 0 && (
        <div>
          <div className="results-grid">
            {prices.map((p, idx) => (
              <div
                key={p._id || p.id || idx}
                className="price-card"
                onClick={() => setSelectedItem(p)}
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
              >
                <div className="price-card-header">
                  <span className="price-card-crop">{p.commodity}</span>
                  <span className="price-card-market">{p.market} {p.county ? `(${p.county})` : ''}</span>
                </div>

                <div className="price-card-amount">
                  {p.wholesalePrice != null && (
                    <div>
                      <span className="price-unit">Wholesale: </span>
                      <strong style={{ color: '#059669' }}>KSh {p.wholesalePrice.toLocaleString()}</strong>
                      <span className="price-unit"> / {p.unit}</span>
                    </div>
                  )}
                  {p.retailPrice != null && (
                    <div>
                      <span className="price-unit">Retail: </span>
                      <strong style={{ color: '#2563eb' }}>KSh {p.retailPrice.toLocaleString()}</strong>
                      <span className="price-unit"> / {p.unit}</span>
                    </div>
                  )}
                </div>

                <div className="price-card-meta">
                  <span>
                    <Calendar size={12} /> Observed: {formatDate(p.observedDate)}
                  </span>
                  <span className="kamis-source-badge" style={{ fontSize: '0.65rem' }}>
                    Source: MavunoAgent
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="info-notice" style={{ marginTop: '1.5rem' }}>
            <Info size={15} />
            <span>
              Agricultural market observations are provided for informational reference extracted directly by MavunoAgent.
            </span>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <MarketPriceDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};

export default MarketInfoPage;
