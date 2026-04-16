import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import AuthPage from './auth/pages/AuthPage';
import ForgotPasswordPage from './auth/pages/ForgotPasswordPage';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
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
          <Route path="auth" element={<AuthPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
