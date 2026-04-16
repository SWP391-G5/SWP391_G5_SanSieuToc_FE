<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AuthPage from './auth/pages/AuthPage';
import ForgotPasswordPage from './auth/pages/ForgotPasswordPage';
=======
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import AuthPage from './auth/pages/AuthPage';
import ForgotPasswordPage from './auth/pages/ForgotPasswordPage';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
>>>>>>> 172abaa (feat: add common CSS styles, API client, Tailwind configuration, and Vite setup)
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
<<<<<<< HEAD
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
=======
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
>>>>>>> 172abaa (feat: add common CSS styles, API client, Tailwind configuration, and Vite setup)
      </Routes>
    </Router>
  );
}

export default App;
