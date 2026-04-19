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

// Context Providers
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { NotificationProvider } from './context/NotificationContext'

// ✅ React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
