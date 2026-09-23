import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import AppShell from '../layouts/AppShell';
import LoadSpinner from '../components/LoadSpinner';

// ── Public pages (eager — small) ──
import LandingPage from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

// ── Authenticated pages (lazy-loaded) ──
const FarmerDashboard     = lazy(() => import('../pages/FarmerDashboardPlaceholder').then(m => ({ default: m.FarmerDashboardPlaceholder })));
const DealerDashboard     = lazy(() => import('../pages/DealerDashboardPlaceholder').then(m => ({ default: m.DealerDashboardPlaceholder })));
const AdminDashboard      = lazy(() => import('../pages/AdminDashboardPlaceholder').then(m => ({ default: m.AdminDashboardPlaceholder })));
const FarmerProfile       = lazy(() => import('../pages/FarmerProfilePage').then(m => ({ default: m.FarmerProfilePage })));
const DealerProfile       = lazy(() => import('../pages/DealerProfilePage').then(m => ({ default: m.DealerProfilePage })));
const ProductionCalc      = lazy(() => import('../pages/ProductionCalculatorPage').then(m => ({ default: m.ProductionCalculatorPage })));
const MyCrops             = lazy(() => import('../pages/MyCropsPage').then(m => ({ default: m.MyCropsPage })));
const DealerSearch        = lazy(() => import('../pages/DealerSearchPage').then(m => ({ default: m.DealerSearchPage })));
const MarketInfo          = lazy(() => import('../pages/MarketInfoPage').then(m => ({ default: m.MarketInfoPage })));
const RightsCentre        = lazy(() => import('../pages/RightsCentrePage').then(m => ({ default: m.RightsCentrePage })));
const Transactions        = lazy(() => import('../pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const MyComplaints        = lazy(() => import('../pages/MyComplaintsPage').then(m => ({ default: m.MyComplaintsPage })));
const Offers              = lazy(() => import('../pages/OffersPage').then(m => ({ default: m.OffersPage })));
const CreateOffer         = lazy(() => import('../pages/CreateOfferPage').then(m => ({ default: m.CreateOfferPage })));
const CounterOffer        = lazy(() => import('../pages/CounterOfferPage').then(m => ({ default: m.CounterOfferPage })));
const Messages            = lazy(() => import('../pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const SettingsPage        = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageLoader = () => (
  <LoadSpinner fullPage={false} size="lg" text="Loading page…" />
);

const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Homepage (Landing Page) ── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          {/* ── Auth pages — isolated full-screen layout ── */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* ── Authenticated routes (AppShell) ── */}
          <Route element={<AppShell />}>
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><FarmerDashboard /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/profile"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><FarmerProfile /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/calculator"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><ProductionCalc /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/crops"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><MyCrops /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/market"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><MarketInfo /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/rights"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><RightsCentre /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/complaints"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><MyComplaints /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/offers/create/:dealerId"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><CreateOffer /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealers"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><DealerSearch /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealers/:id"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><DealerProfile /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/market"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <Suspense fallback={<PageLoader />}><MarketInfo /></Suspense>
                </ProtectedRoute>
              }
            />

            {/* Dealer routes */}
            <Route
              path="/dealer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DEALER']}>
                  <Suspense fallback={<PageLoader />}><DealerDashboard /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealer/profile"
              element={
                <ProtectedRoute allowedRoles={['DEALER']}>
                  <Suspense fallback={<PageLoader />}><DealerProfile /></Suspense>
                </ProtectedRoute>
              }
            />

            {/* Shared routes */}
            <Route
              path="/offers"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER']}>
                  <Suspense fallback={<PageLoader />}><Offers /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/offers/:offerId/counter"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER']}>
                  <Suspense fallback={<PageLoader />}><CounterOffer /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER']}>
                  <Suspense fallback={<PageLoader />}><Messages /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER']}>
                  <Suspense fallback={<PageLoader />}><Transactions /></Suspense>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
                </ProtectedRoute>
              }
            />
            {/* Settings — all authenticated users */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER', 'ADMIN']}>
                  <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;
