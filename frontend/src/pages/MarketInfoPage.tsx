import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, RefreshCw, AlertTriangle, Info, Calendar, MapPin, Package, Filter } from 'lucide-react';
import { marketDataService, type MarketDataItem } from '../services/marketDataService';
import { MarketTicker } from '../components/MarketTicker';
import { MarketPriceDetailModal } from '../components/MarketPriceDetailModal';
import { ComboSearchInput } from '../components/ComboSearchInput';
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
  const [selectedItem, setSelectedItem] = useState<MarketDataItem | null>(null);

  // Dynamic options extracted from live market observations + verified reference list
  const availableCommodities = useMemo(() => {
    const set = new Set<string>();
    tickerItems.forEach(r => {
      if (r.commodity?.trim()) set.add(r.commodity.trim());
    });
    [
      'Dry Maize',
      'White Maize',
      'Beans (Yellow)',
      'Beans (Rosecoco)',
      'Beans (Mwitemania)',
      'Irish Potatoes',
      'Sweet Potatoes',
      'Tomatoes',
      'Cabbage',
      'Kales (Sukuma Wiki)',
      'Spinach',
      'Red Bulb Onions',
      'Spring Onions',
      'Rice (Pishori)',
      'Rice (Sindano)',
      'Watermelon',
      'Carrots',
      'Capsicum (Pilipili Hoho)',
      'Avocado (Hass)',
      'Bananas (Cooking)',
      'Bananas (Ripe)',
      'Green Grams (Ndengu)',
      'Sorghum',
      'Finger Millet'
    ].forEach(c => set.add(c));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickerItems]);

  const availableMarkets = useMemo(() => {
    const set = new Set<string>();
    tickerItems.forEach(r => {
      if (r.market?.trim()) set.add(r.market.trim());
    });
    [
      'Eldoret Main',
      'Langas',
      'Kangeta',
      'Nakuru Wholesale',
      'Kisumu Municipal',
      'Mombasa Wholesale',
      'Wakulima Market (Nairobi)',
      'Gikomba Market (Nairobi)',
      'Muthurwa (Nairobi)',
      'Kitale Main Market',
      'Kakamega Municipal Market',
      'Nyeri Municipal Market',
      'Machakos Open Air Market',
      'Thika Main Market',
      'Karatina Market',
      'Meru Central Market',
      'Kericho Main Market',
      'Kisii Town Market'
    ].forEach(m => set.add(m));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickerItems]);

  const availableCounties = useMemo(() => {
    const set = new Set<string>();
    tickerItems.forEach(r => {
      if (r.county?.trim()) set.add(r.county.trim());
    });
    [
      'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
      'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
      'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
      'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a',
      'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
      'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
      'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
    ].forEach(c => set.add(c));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickerItems]);

  const handleResetFilters = () => {
    setCommodityQuery('');
    setMarketQuery('');
    setCountyQuery('');
    setPriceTypeFilter('all');
    fetchLatestData();
  };

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
            Live agricultural market price observations across Kenya's regional wholesale and retail markets.
          </p>
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
          <ComboSearchInput
            id="commodity-query"
            label={<><Package size={14} /> Commodity</>}
            value={commodityQuery}
            onChange={setCommodityQuery}
            options={availableCommodities}
            placeholder="Type or select e.g. Tomatoes, Maize, Beans"
          />

          <ComboSearchInput
            id="market-query"
            label={<><MapPin size={14} /> Market</>}
            value={marketQuery}
            onChange={setMarketQuery}
            options={availableMarkets}
            placeholder="Type or select e.g. Nairobi, Nakuru, Eldoret"
          />

          <ComboSearchInput
            id="county-query"
            label={<><MapPin size={14} /> County</>}
            value={countyQuery}
            onChange={setCountyQuery}
            options={availableCounties}
            placeholder="Type or select e.g. Nairobi, Uasin Gishu"
          />

          <div className="form-field form-field--price-type" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e8f5ec', marginBottom: '8px' }}>
              <Filter size={15} style={{ color: '#5ec285' }} /> Price Type Filter
            </label>
            <div className="price-type-selector-pills">
              <button
                type="button"
                className={`price-pill-btn ${priceTypeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPriceTypeFilter('all')}
              >
                <span className="pill-dot"></span>
                All Prices (Wholesale & Retail)
              </button>
              <button
                type="button"
                className={`price-pill-btn price-pill-btn--wholesale ${priceTypeFilter === 'wholesale' ? 'active' : ''}`}
                onClick={() => setPriceTypeFilter('wholesale')}
              >
                <span className="pill-dot wholesale"></span>
                Wholesale Prices Only
              </button>
              <button
                type="button"
                className={`price-pill-btn price-pill-btn--retail ${priceTypeFilter === 'retail' ? 'active' : ''}`}
                onClick={() => setPriceTypeFilter('retail')}
              >
                <span className="pill-dot retail"></span>
                Retail Prices Only
              </button>
            </div>
          </div>

          <div className="form-field form-field--actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Search size={16} /> Search Market Observations
            </button>
            <button type="button" onClick={handleResetFilters} disabled={loading} className="btn btn-outline">
              <RefreshCw size={16} /> Reset Filters
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
            Live agricultural market price observations across regional wholesale and retail markets. You can click below to refresh the latest data.
          </p>
          <button className="btn btn-primary" onClick={fetchLatestData} disabled={loading} style={{ margin: '0 auto' }}>
            <RefreshCw size={16} /> Refresh Market Data
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
                </div>
              </div>
            ))}
          </div>

          <div className="info-notice" style={{ marginTop: '1.5rem' }}>
            <Info size={15} />
            <span>
              Agricultural market observations are compiled across wholesale and retail markets for informational reference.
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
