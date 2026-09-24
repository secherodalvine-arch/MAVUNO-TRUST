import type { MarketDataItem } from '../services/marketDataService';
import { MapPin, Calendar } from 'lucide-react';
import '../styles/marketTicker.css';

interface MarketPriceDetailModalProps {
  item: MarketDataItem | null;
  onClose: () => void;
}

export const MarketPriceDetailModal: React.FC<MarketPriceDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
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
    <div className="kamis-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="market-modal-title">
      <div className="kamis-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="kamis-modal-header">
          <div>
            <h3 id="market-modal-title" className="kamis-modal-title">{item.commodity}</h3>
            <span className="kamis-card-location">
              <MapPin size={13} /> {item.market} {item.county ? `, ${item.county} County` : ''}
            </span>
          </div>
          <button className="kamis-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="kamis-detail-grid">
          <div className="kamis-detail-item">
            <span className="kamis-detail-label">Commodity</span>
            <span className="kamis-detail-value">{item.commodity}</span>
          </div>

          <div className="kamis-detail-item">
            <span className="kamis-detail-label">Classification / Grade</span>
            <span className="kamis-detail-value">
              {item.classification || 'Standard'} {item.grade ? `(${item.grade})` : ''} {item.sex ? `• Sex: ${item.sex}` : ''}
            </span>
          </div>

          <div className="kamis-detail-item">
            <span className="kamis-detail-label">Wholesale Price</span>
            <span className="kamis-detail-value">
              {item.wholesalePrice != null ? `KSh ${item.wholesalePrice.toLocaleString()} / ${item.unit}` : 'Not provided'}
            </span>
          </div>

          <div className="kamis-detail-item">
            <span className="kamis-detail-label">Retail Price</span>
            <span className="kamis-detail-value">
              {item.retailPrice != null ? `KSh ${item.retailPrice.toLocaleString()} / ${item.unit}` : 'Not provided'}
            </span>
          </div>

          <div className="kamis-detail-item">
            <span className="kamis-detail-label">Measurement Unit</span>
            <span className="kamis-detail-value">{item.unit}</span>
          </div>

          {item.supplyVolume != null && (
            <div className="kamis-detail-item">
              <span className="kamis-detail-label">Supply Volume</span>
              <span className="kamis-detail-value">{item.supplyVolume.toLocaleString()}</span>
            </div>
          )}

          <div className="kamis-detail-item">
            <span className="kamis-detail-label">Observed Date</span>
            <span className="kamis-detail-value">
              <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
              {formatDate(item.observedDate)}
            </span>
          </div>

          <div className="kamis-detail-item">
            <span className="kamis-detail-label">Retrieved Date</span>
            <span className="kamis-detail-value">{formatDate(item.retrievedAt)}</span>
          </div>
        </div>

        <div className="kamis-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const KamisPriceDetailModal = MarketPriceDetailModal;
