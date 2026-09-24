import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  User, Leaf, TrendingUp, Calculator, Search,
  HandshakeIcon, ArrowRight,
} from 'lucide-react';
import { MarketTicker } from '../components/MarketTicker';
import { MarketPriceDetailModal } from '../components/MarketPriceDetailModal';
import { marketDataService, type MarketDataItem } from '../services/marketDataService';

export const FarmerDashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();
  const [tickerItems, setTickerItems] = useState<MarketDataItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketDataItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    marketDataService
      .getMarketPrices({ limit: 50 })
      .then((res) => {
        if (isMounted && res.success && res.data?.records) {
          setTickerItems(res.data.records);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-wrapper">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong style={{ color: 'var(--color-text-primary)' }}>{user?.fullName}</strong>
          </p>
        </div>
      </div>

      {/* Agricultural Market Observations Live Ticker */}
      {tickerItems.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <MarketTicker items={tickerItems} onSelect={(item) => setSelectedItem(item)} />
        </div>
      )}

      {/* Selected Market Observation Modal */}
      {selectedItem && (
        <MarketPriceDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Dashboard cards */}
      <div className="dash-grid">
        <Link to="/dealers" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
            <Search size={20} />
          </div>
          <span className="dash-card-title">Find Dealers</span>
          <p className="dash-card-desc">Search and connect with verified dealers and brokers across Kenya.</p>
          <span className="dash-card-link">Search Dealers <ArrowRight size={13} /></span>
        </Link>

        <Link to="/farmer/profile" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(39,137,79,0.12)', color: '#5ec285' }}>
            <User size={20} />
          </div>
          <span className="dash-card-title">Farmer Profile</span>
          <p className="dash-card-desc">Public general area display with protected exact farm location controls.</p>
          <span className="dash-card-link">Edit Profile <ArrowRight size={13} /></span>
        </Link>

        <Link to="/farmer/crops" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(94,194,133,0.1)', color: '#5ec285' }}>
            <Leaf size={20} />
          </div>
          <span className="dash-card-title">Crop Listings</span>
          <p className="dash-card-desc">Post available crop quantities, units, and harvest periods for dealers.</p>
          <span className="dash-card-link">Manage Crops <ArrowRight size={13} /></span>
        </Link>

        <Link to="/farmer/market" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(245,166,35,0.1)', color: '#f8c06a' }}>
            <TrendingUp size={20} />
          </div>
          <span className="dash-card-title">Market Prices</span>
          <p className="dash-card-desc">Real-time reference agricultural prices across Kenyan markets.</p>
          <span className="dash-card-link">Browse Prices <ArrowRight size={13} /></span>
        </Link>

        <Link to="/farmer/calculator" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
            <Calculator size={20} />
          </div>
          <span className="dash-card-title">Production Calculator</span>
          <p className="dash-card-desc">Calculate private production costs and break-even estimates.</p>
          <span className="dash-card-link">Open Calculator <ArrowRight size={13} /></span>
        </Link>

        <Link to="/offers" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(56,189,248,0.1)', color: '#7dd3fc' }}>
            <HandshakeIcon size={20} />
          </div>
          <span className="dash-card-title">My Offers</span>
          <p className="dash-card-desc">Review active trade offers and counteroffers from dealers.</p>
          <span className="dash-card-link">View Offers <ArrowRight size={13} /></span>
        </Link>
      </div>
    </div>
  );
};
