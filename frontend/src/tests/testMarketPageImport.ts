import { MarketInfoPage } from '../pages/MarketInfoPage';
import DefaultMarketPage from '../pages/MarketInfoPage';
import { marketDataService } from '../services/marketDataService';
import { MarketTicker } from '../components/MarketTicker';
import { MarketPriceDetailModal } from '../components/MarketPriceDetailModal';

console.log('✓ Named MarketInfoPage component:', typeof MarketInfoPage);
console.log('✓ Default MarketInfoPage component:', typeof DefaultMarketPage);
console.log('✓ marketDataService:', typeof marketDataService);
console.log('✓ MarketTicker component:', typeof MarketTicker);
console.log('✓ MarketPriceDetailModal component:', typeof MarketPriceDetailModal);
