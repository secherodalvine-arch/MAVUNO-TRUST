import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import LandingPage from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { FarmerDashboardPlaceholder } from '../pages/FarmerDashboardPlaceholder';
import { DealerDashboardPlaceholder } from '../pages/DealerDashboardPlaceholder';
import { AdminDashboardPlaceholder } from '../pages/AdminDashboardPlaceholder';
import { FarmerProfilePage } from '../pages/FarmerProfilePage';
import { ProductionCalculatorPage } from '../pages/ProductionCalculatorPage';
import { MyCropsPage } from '../pages/MyCropsPage';
import { DealerProfilePage } from '../pages/DealerProfilePage';
import { DealerSearchPage } from '../pages/DealerSearchPage';
import { MarketInfoPage } from '../pages/MarketInfoPage';
import { RightsCentrePage } from '../pages/RightsCentrePage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { MyComplaintsPage } from '../pages/MyComplaintsPage';
import { OffersPage } from '../pages/OffersPage';
import { CreateOfferPage } from '../pages/CreateOfferPage';
import { CounterOfferPage } from '../pages/CounterOfferPage';
import { MessagesPage } from '../pages/MessagesPage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Farmer Protected Routes */}
            {/* Shared Offer Routes */}
            <Route
              path="/offers"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER']}>
                  <OffersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offers/:offerId/counter"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER']}>
                  <CounterOfferPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER']}>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'DEALER']}>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />

            {/* Farmer Only Routes */}
            <Route
              path="/farmer/offers/create/:dealerId"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <CreateOfferPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <FarmerDashboardPlaceholder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/profile"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <FarmerProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/calculator"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <ProductionCalculatorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/crops"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <MyCropsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/market"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <MarketInfoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/rights"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <RightsCentrePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/complaints"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <MyComplaintsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/market"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <MarketInfoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealers"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <DealerSearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealers/:id"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <DealerProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Dealer Protected Routes */}
            <Route
              path="/dealer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DEALER']}>
                  <DealerDashboardPlaceholder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealer/profile"
              element={
                <ProtectedRoute allowedRoles={['DEALER']}>
                  <DealerProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPlaceholder />
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
