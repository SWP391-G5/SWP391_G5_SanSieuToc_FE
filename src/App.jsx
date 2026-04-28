import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AuthPage from "./pages/auth/AuthPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import MainLayout from "./layouts/MainLayout";
import FieldListPage from "./pages/Customer/Fields/FieldListPage";
import HomePage from "./pages/Customer/Home/HomePage";
import WishlistPage from "./pages/Customer/Wishlist/WishlistPage";
import CommunityPage from "./pages/Customer/Community/CommunityPage";
import CommunityMyPostsPage from "./pages/Customer/Community/CommunityMyPostsPage";
import CommunityPostDetailPage from "./pages/Customer/Community/CommunityPostDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import UserProfilePage from "./pages/UserProfilePage";
import TopUpPage from "./pages/Payment/TopUpPage";
import CheckoutPage from "./pages/Payment/CheckoutPage";
import FieldDetailPage from "./pages/Customer/Fields/FieldDetailPage";
import BookingConfirmPage from "./pages/Payment/BookingConfirmPage";
import ServicePage from "./pages/Services/ServicePage";
import PolicyPage from "./pages/Customer/Policy/PolicyPage";
import FeedbackPage from "./pages/Customer/Feedback/FeedbackPage";
import AdminLayout from "./layouts/AdminLayout";
import ManagerAccountsPage from "./pages/admin/ManagerAccountsPage";
import OwnerAccountsPage from "./pages/admin/OwnerAccountsPage";
import CustomerAccountsPage from "./pages/admin/CustomerAccountsPage";
import ReportsPage from "./pages/admin/ReportsPage";

import ManagerLayout from "./layouts/manager/ManagerLayout";
import RequireManager from "./components/manager/RequireManager";
import {
  ManagerFeedbackPage,
  ManagerPostsPage,
  ManagerPrivacyPage,
  ManagerStatisticsPage,
  ManagerWalletPage,
  ManagerWithdrawPage,
} from "./pages/Manager";

import ManagerMarketingImagesPage from "./pages/Manager/ManagerMarketingImagesPage";

import RequireOwner from "./components/owner/RequireOwner";
import OwnerLayout from "./layouts/owner/OwnerLayout";
import OwnerDashboardPage from "./pages/owner/OwnerDashboardPage";
import OwnerFieldsPage from "./pages/owner/OwnerFieldsPage";
import OwnerFieldDetailPage from "./pages/owner/OwnerFieldDetailPage";
import OwnerBookingsPage from "./pages/owner/OwnerBookingsPage";
import OwnerServiceBookingsPage from "./pages/owner/OwnerServiceBookingsPage";
import OwnerRefundsPage from "./pages/owner/OwnerRefundsPage";
import OwnerWalletPage from "./pages/owner/OwnerWalletPage";
import OwnerWithdrawPage from "./pages/owner/OwnerWithdrawPage";
import OwnerPostsPage from "./pages/owner/OwnerPostsPage";
import OwnerRevenuePage from "./pages/owner/OwnerRevenuePage";
import OwnerFeedbackManagementPage from "./pages/owner/OwnerFeedbackManagementPage";
import OwnerReportsPage from "./pages/owner/OwnerReportsPage";
import OwnerVouchersPage from "./pages/owner/OwnerVouchersPage";

import { useAuth } from "./context/AuthContext";
import { PreviewModeProvider } from "./context/PreviewModeContext";

function RequireAuth({ children }) {
  const auth = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const auth = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/auth" replace />;
  if (String(auth.user?.role || "").trim() !== "Admin")
    return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <PreviewModeProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="fields" element={<FieldListPage />} />
            <Route path="fields/:id" element={<FieldDetailPage />} />
            <Route path="booking-confirm" element={<BookingConfirmPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route
              path="community/my-posts"
              element={<CommunityMyPostsPage />}
            />
            <Route path="community/:id" element={<CommunityPostDetailPage />} />
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
              path="feedback"
              element={
                <RequireAuth>
                  <FeedbackPage />
                </RequireAuth>
              }
            />
            <Route path="policy" element={<PolicyPage />} />

            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route
                index
                element={<Navigate to="/admin/managers" replace />}
              />
              <Route path="managers" element={<ManagerAccountsPage />} />
              <Route path="owners" element={<OwnerAccountsPage />} />
              <Route path="customers" element={<CustomerAccountsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile" element={<UserProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* 404 Not Found for Main Layout */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Owner Area */}
          <Route
            path="/owner"
            element={
              <RequireOwner>
                <OwnerLayout />
              </RequireOwner>
            }
          >
            <Route index element={<Navigate to="/owner/fields" replace />} />
            <Route path="dashboard" element={<OwnerDashboardPage />} />
            <Route path="fields" element={<OwnerFieldsPage />} />
            <Route path="bookings" element={<OwnerBookingsPage />} />
            <Route
              path="service-bookings"
              element={<OwnerServiceBookingsPage />}
            />
            <Route path="refunds" element={<OwnerRefundsPage />} />
            <Route path="wallet" element={<OwnerWalletPage />} />
            <Route path="withdraw" element={<OwnerWithdrawPage />} />
            <Route path="posts" element={<OwnerPostsPage />} />
            <Route path="revenue" element={<OwnerRevenuePage />} />
            <Route path="reports" element={<OwnerReportsPage />} />
            <Route path="feedbacks" element={<OwnerFeedbackManagementPage />} />
            <Route path="vouchers" element={<OwnerVouchersPage />} />
            <Route path="profile" element={<UserProfilePage />} />
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
            <Route
              index
              element={<Navigate to="/manager/statistics" replace />}
            />
            <Route path="statistics" element={<ManagerStatisticsPage />} />
            <Route path="posts" element={<ManagerPostsPage />} />
            <Route
              path="banners-ads"
              element={<ManagerMarketingImagesPage />}
            />
            <Route path="wallet" element={<ManagerWalletPage />} />
            <Route path="withdraw" element={<ManagerWithdrawPage />} />
            <Route path="privacy" element={<ManagerPrivacyPage />} />
            <Route path="feedback" element={<ManagerFeedbackPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </PreviewModeProvider>
    </Router>
  );
}

export default App;
