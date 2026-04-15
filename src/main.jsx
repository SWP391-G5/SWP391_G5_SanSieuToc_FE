/**
 * @fileoverview Application Entry Point
 * 
 * Khởi tạo React app với các Context Providers:
 * - ThemeProvider: Quản lý dark/light mode
 * - AuthProvider: Quản lý authentication state
 * - AppProvider: Quản lý global state, API calls, search, CRUD
 * 
 * @author San Sieu Toc Team
 * @date 2026-02-27
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// i18n removed (no locales)

// Context Providers
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { NotificationProvider } from './context/NotificationContext'

// Notification styles
import './styles/Notification.css'

// ============================================================================
// APP INITIALIZATION
// ============================================================================

/**
 * Context Provider Order (ngoài → trong):
 * 1. ThemeProvider - Theme không phụ thuộc gì
 * 2. AuthProvider - Auth cần cho các API calls
 * 3. AppProvider - App context cần Auth để gọi API
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
