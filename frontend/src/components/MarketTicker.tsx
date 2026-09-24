import React, { useState } from 'react';
import type { MarketDataItem } from '../services/marketDataService';
import { MapPin, Calendar, Info } from 'lucide-react';
import '../styles/marketTicker.css';

interface MarketTickerProps {
  items: MarketDataItem[];
  onSelect: (item: MarketDataItem) => void;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ items, onSelect }) => {
  const [isPaused, setIsPaused] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  // Duplicate list to create a seamless infinite looping ticker if dataset is small
  const displayItems = items.length < 10 ? [...items, ...items, ...items] : items;

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
    <div className="kamis-ticker-section" role="region" aria-label="Live Market Ticker">
      <div className="kamis-ticker-header">
        <div className="kamis-ticker-title">
          <span>Agricultural Market Observations</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <Info size={12} /> Hover or touch to pause ticker
        </span>
      </div>

      <div
        className="kamis-ticker-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className={`kamis-ticker-track ${isPaused ? 'paused' : ''}`}>
          {displayItems.map((item, idx) => (
            <div
              key={`${item._id || item.id || idx}-${idx}`}
              className="kamis-card"
              onClick={() => onSelect(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(item);
                }
              }}
            >
              <div className="kamis-card-top">
                <span className="kamis-card-commodity">{item.commodity}</span>
                {item.isDevelopmentData && (
                  <span className="kamis-dev-badge">DEV DATA</span>
                )}
              </div>

              <div className="kamis-card-location">
                <MapPin size={12} />
                <span>
                  {item.market} {item.county ? `(${item.county})` : ''}
                </span>
              </div>

              <div className="kamis-card-prices">
                {item.wholesalePrice != null && (
                  <div className="kamis-card-price-row">
                    <span className="kamis-price-label">Wholesale:</span>
                    <span className="kamis-price-val">KSh {item.wholesalePrice.toLocaleString()}/{item.unit}</span>
                  </div>
                )}
                {item.retailPrice != null && (
                  <div className="kamis-card-price-row">
                    <span className="kamis-price-label">Retail:</span>
                    <span className="kamis-price-val">KSh {item.retailPrice.toLocaleString()}/{item.unit}</span>
                  </div>
                )}
              </div>

              <div className="kamis-card-date">
                <span>
                  <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
                  Observed: {formatDate(item.observedDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const KamisMarketTicker = MarketTicker;
