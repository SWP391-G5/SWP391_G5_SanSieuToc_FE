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
      </Routes>
    </Router>
  );
}

export default App;
