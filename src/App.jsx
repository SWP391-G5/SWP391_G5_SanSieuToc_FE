import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AuthPage from './pages/auth/AuthPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import MainLayout from './layouts/MainLayout';
import FieldListPage from './pages/Customer/Fields/FieldListPage';
import HomePage from './pages/Customer/Home/HomePage';
import WishlistPage from './pages/Customer/Wishlist/WishlistPage';
import CommunityPage from './pages/Customer/Community/CommunityPage';
import NotFoundPage from './pages/NotFoundPage';
import UserProfilePage from './pages/UserProfilePage';

import ManagerLayout from './layouts/manager/ManagerLayout';
import RequireManager from './components/manager/RequireManager';
import {
  ManagerBannersPage,
  ManagerFeedbackPage,
  ManagerPostsPage,
  ManagerPrivacyPage,
  ManagerSlidesPage,
  ManagerStatisticsPage,
  ManagerWalletPage,
} from './pages/Manager';

import { useAuth } from './context/AuthContext';

function RequireAuth({ children }) {
  const auth = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="fields" element={<FieldListPage />} />
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
          <Route path="slides" element={<ManagerSlidesPage />} />
          <Route path="banners" element={<ManagerBannersPage />} />
          <Route path="wallet" element={<ManagerWalletPage />} />
          <Route path="privacy" element={<ManagerPrivacyPage />} />
          <Route path="feedback" element={<ManagerFeedbackPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
