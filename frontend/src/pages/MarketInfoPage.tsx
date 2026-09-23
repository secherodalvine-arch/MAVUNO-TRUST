import React, { useState } from 'react';
import { Search, TrendingUp, RefreshCw, AlertTriangle, Info, Calendar, MapPin, Package, DollarSign } from 'lucide-react';
import { marketService, type MarketPriceItem } from '../services/marketService';
import LoadSpinner from '../components/LoadSpinner';
import '../styles/pages.css';

export const MarketInfoPage: React.FC = () => {
  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cropQuery, setCropQuery] = useState('');
  const [marketQuery, setMarketQuery] = useState('');

  React.useEffect(() => { fetchLatest(); }, []);

  const fetchLatest = async () => {
    setLoading(true); setError(false);
    try {
      const res = await marketService.getLatestPrices();
      setPrices(res.success && res.data?.prices ? res.data.prices : []);
    } catch { setError(true); setPrices([]); }
    finally { setLoading(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(false); setHasSearched(true);
    try {
      const res = await marketService.searchPrices({
        cropName: cropQuery.trim() || undefined,
        market: marketQuery.trim() || undefined,
      });
      setPrices(res.success && res.data?.prices ? res.data.prices : []);
    } catch { setError(true); setPrices([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-icon green">
          <TrendingUp size={22} />
        </div>
        <div>
          <h1 className="page-title">Market Prices</h1>
          <p className="page-subtitle">
            Live agricultural market prices from ShambaRecords — use these to make informed selling decisions.
          </p>
        </div>
      </div>

      {/* Search form */}
      <div className="page-card page-card--spaced">
        <h2 className="section-heading">Search Market Prices</h2>
        <form onSubmit={handleSearch} className="page-form-grid">
          <div className="form-field">
            <label className="form-label" htmlFor="crop-query">
              <Package size={14} /> Crop Name
            </label>
            <input
              id="crop-query"
              type="text"
              className="form-input"
              value={cropQuery}
              onChange={e => setCropQuery(e.target.value)}
              placeholder="e.g. Maize, Beans, Tomatoes"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="market-query">
              <MapPin size={14} /> Market / Location
            </label>
            <input
              id="market-query"
              type="text"
              className="form-input"
              value={marketQuery}
              onChange={e => setMarketQuery(e.target.value)}
              placeholder="e.g. Nairobi, Nakuru (Optional)"
            />
          </div>
          <div className="form-field form-field--actions">
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Search size={16} /> Check Prices
            </button>
            <button type="button" onClick={fetchLatest} disabled={loading} className="btn btn-outline">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </form>
      </div>

      {/* States */}
      {loading && <LoadSpinner fullPage={false} size="md" text="Checking market prices…" />}

      {!loading && error && (
        <div className="state-card state-card--error">
          <AlertTriangle size={20} />
          <span className="state-title">Could not load market prices</span>
          <span className="state-desc">Please ensure the backend is running and try again.</span>
          <button className="btn btn-outline" onClick={fetchLatest}>Retry</button>
        </div>
      )}

      {!loading && !error && hasSearched && prices.length === 0 && (
        <div className="state-card">
          <Search size={24} />
          <span className="state-title">No results found</span>
          <span className="state-desc">No price data found for your search. Try different terms or check back later.</span>
        </div>
      )}

      {!loading && !error && !hasSearched && prices.length === 0 && (
        <div className="state-card">
          <TrendingUp size={24} />
          <span className="state-title">No latest prices available</span>
          <span className="state-desc">Market price data is not available right now. Please check back later.</span>
        </div>
      )}

      {/* Results */}
      {!loading && !error && prices.length > 0 && (
        <div>
          <div className="results-grid">
            {prices.map(p => (
              <div key={p.id || p.externalId} className="price-card">
                <div className="price-card-header">
                  <span className="price-card-crop">{p.cropName}</span>
                  <span className="price-card-market">{p.marketName || 'Unknown market'}</span>
                </div>
                <div className="price-card-amount">
                  <DollarSign size={16} />
                  <span>{p.price?.toLocaleString()}</span>
                  <span className="price-unit">/ {p.unit}</span>
                  <span className="price-currency">{p.currency}</span>
                </div>
                <div className="price-card-meta">
                  <span><Calendar size={12} /> {new Date(p.recordedAt).toLocaleDateString()}</span>
                  <span>Source: {p.source || 'ShambaRecords'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="info-notice">
            <Info size={15} />
            <span>Market prices are for reference only — they may change and do not guarantee the price you will receive from a buyer. Always confirm directly with your buyer.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketInfoPage;
