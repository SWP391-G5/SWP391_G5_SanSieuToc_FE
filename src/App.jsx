import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AuthPage from './pages/auth/AuthPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import MainLayout from './layouts/MainLayout';
import FieldListPage from './pages/Fields/FieldListPage';
import HomePage from './pages/Home/HomePage';
import WishlistPage from './pages/Wishlist/WishlistPage';
import CommunityPage from './pages/Community/CommunityPage';
import NotFoundPage from './pages/NotFoundPage';
import UserProfilePage from './pages/UserProfilePage';
import TopUpPage from './pages/Payment/TopUpPage';
import CheckoutPage from './pages/Payment/CheckoutPage';
import FieldDetailPage from './pages/Fields/FieldDetailPage';
import BookingConfirmPage from './pages/Payment/BookingConfirmPage';
import ServicePage from './pages/Services/ServicePage';
import AdminLayout from './layouts/AdminLayout';
import ManagerAccountsPage from './pages/admin/ManagerAccountsPage';
import OwnerAccountsPage from './pages/admin/OwnerAccountsPage';
import CustomerAccountsPage from './pages/admin/CustomerAccountsPage';
import ReportsPage from './pages/admin/ReportsPage';

import ManagerLayout from './layouts/manager/ManagerLayout';
import RequireManager from './components/manager/RequireManager';
import {
  ManagerFeedbackPage,
  ManagerPostsPage,
  ManagerPrivacyPage,
  ManagerStatisticsPage,
  ManagerWalletPage,
} from './pages/Manager';

import ManagerMarketingImagesPage from './pages/Manager/ManagerMarketingImagesPage';

import { useAuth } from './context/AuthContext';

function RequireAuth({ children }) {
  const auth = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const auth = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/auth" replace />;
  if (String(auth.user?.role || '').trim() !== 'Admin') return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="fields" element={<FieldListPage />} />
          <Route path="fields/:id" element={<FieldDetailPage />} />
          <Route path="booking-confirm" element={<BookingConfirmPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="profile"
            element={
              <RequireAuth>
                <UserProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="top-up"
            element={
              <RequireAuth>
                <TopUpPage />
              </RequireAuth>
            }
          />
          <Route
            path="checkout"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="services"
            element={
              <RequireAuth>
                <ServicePage />
              </RequireAuth>
            }
          />

          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="/admin/managers" replace />} />
            <Route path="managers" element={<ManagerAccountsPage />} />
            <Route path="owners" element={<OwnerAccountsPage />} />
            <Route path="customers" element={<CustomerAccountsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Manager Area */}
        <Route
          path="/manager"
          element={
            <RequireManager>
              <ManagerLayout />
            </RequireManager>
          }
        >
          <Route index element={<Navigate to="/manager/statistics" replace />} />
          <Route path="statistics" element={<ManagerStatisticsPage />} />
          <Route path="posts" element={<ManagerPostsPage />} />

          {/* Unified marketing images management */}
          <Route path="banners-ads" element={<ManagerMarketingImagesPage />} />

          <Route path="wallet" element={<ManagerWalletPage />} />
          <Route path="privacy" element={<ManagerPrivacyPage />} />
          <Route path="feedback" element={<ManagerFeedbackPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
