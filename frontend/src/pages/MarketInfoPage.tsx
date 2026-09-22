import React, { useState } from 'react';
import { marketService, type MarketPriceItem } from '../services/marketService';

export const MarketInfoPage: React.FC = () => {
  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  const [cropQuery, setCropQuery] = useState<string>('');
  const [marketQuery, setMarketQuery] = useState<string>('');

  React.useEffect(() => {
    fetchLatest();
  }, []);

  const fetchLatest = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const res = await marketService.getLatestPrices();
      if (res.success && res.data && res.data.prices) {
        setPrices(res.data.prices);
      } else {
        setPrices([]);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setHasSearched(true);
    
    try {
      const res = await marketService.searchPrices({
        cropName: cropQuery.trim() || undefined,
        market: marketQuery.trim() || undefined,
      });

      if (res.success && res.data && res.data.prices) {
        // We only use the normalized properties coming from the backend
        setPrices(res.data.prices);
      } else {
        setPrices([]);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* 1. Page Title & 2. Explanation */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 10px 0' }}>Market Prices</h1>
        <p style={{ fontSize: '1.1rem', color: '#444', margin: 0 }}>
          See available market prices for your crop. These prices come from a market-data source and may change over time.
        </p>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '30px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ marginBottom: '15px' }}>
            {/* 3. Crop selection */}
            <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>
              What crop do you want to check?
            </label>
            <input 
              type="text" 
              value={cropQuery}
              onChange={e => setCropQuery(e.target.value)}
              placeholder="e.g. Maize, Beans"
              style={{ width: '100%', padding: '12px', fontSize: '1.1rem', borderRadius: '4px', border: '1px solid #aaa' }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            {/* 4. Market selection */}
            <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>
              Which market do you want to check?
            </label>
            <input 
              type="text" 
              value={marketQuery}
              onChange={e => setMarketQuery(e.target.value)}
              placeholder="e.g. Nairobi, Nakuru (Optional)"
              style={{ width: '100%', padding: '12px', fontSize: '1.1rem', borderRadius: '4px', border: '1px solid #aaa' }}
            />
          </div>

          {/* 5. Clear button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '15px', fontSize: '1.2rem', fontWeight: 'bold', 
              backgroundColor: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            Check Market Price
          </button>
        </form>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0f8ff', border: '1px solid #bce8f1', borderRadius: '8px', fontSize: '1.2rem' }}>
          Checking available market prices...
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', fontSize: '1.1rem' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>We couldn't get the market price right now.</p>
          <p style={{ margin: 0 }}>Please try again later.</p>
        </div>
      )}

      {/* NO DATA STATE */}
      {!loading && !error && hasSearched && prices.length === 0 && (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1.1rem' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>No market price is available right now.</p>
          <p style={{ margin: 0 }}>We could not find a current price for the information you selected. Please try again later or check another market.</p>
        </div>
      )}

      {!loading && !error && !hasSearched && prices.length === 0 && (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1.1rem' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>No latest market prices are available right now.</p>
          <p style={{ margin: 0 }}>Please check again later.</p>
        </div>
      )}

      {/* DATA RESULTS */}
      {!loading && !error && prices.length > 0 && (
        <div>
          {prices.map(p => (
            <div key={p.id || p.externalId} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '1.1rem' }}>
                <div><strong>Crop:</strong> {p.cropName}</div>
                <div><strong>Market:</strong> {p.marketName || 'Unknown'}</div>
                <div><strong>Price:</strong> {p.price?.toLocaleString()}</div>
                <div><strong>Unit:</strong> {p.unit}</div>
                <div><strong>Currency:</strong> {p.currency}</div>
                <div><strong>Recorded:</strong> {new Date(p.recordedAt).toLocaleString()}</div>
                <div><strong>Source:</strong> {p.source || 'ShambaRecords'}</div>
              </div>

            </div>
          ))}

          {/* 7. Simple explanation */}
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ddd' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>Why are we showing this?</h4>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              Market prices can help you understand the prices recorded for your crop in different markets. The price shown here is information from the stated source. It is not a promise of what you will receive from a buyer.
            </p>
          </div>

          {/* 8. Simple notice */}
          <div style={{ backgroundColor: '#fffbe6', padding: '15px', borderRadius: '8px', border: '1px solid #ffe58f' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>
              Prices can change. Check the recorded date before using this information.
            </p>
          </div>

        </div>
      )}
    </div>
  );
};


export default MarketInfoPage;
