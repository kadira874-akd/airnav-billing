import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { ToastProvider } from './components/ui/Toast';
import { useAuthStore, useUIStore, applyTheme } from './store/stores';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FlightsPage from './pages/FlightsPage';
import BatchPage from './pages/BatchPage';
import MasterPage from './pages/MasterPage';
import SettingsPage from './pages/SettingsPage';
import PublicBatchPage from './pages/PublicBatchPage';
import PublicDocPage from './pages/PublicDocPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeSync() {
  const theme = useUIStore((s) => s.theme);
  useEffect(() => applyTheme(theme), [theme]);
  return null;
}

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireRedirect() {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ThemeSync />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/flights" element={<FlightsPage />} />
              <Route path="/batch" element={<BatchPage />} />
              <Route path="/master" element={<MasterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            {/* Public routes — no auth */}
            <Route path="/b/:bid/:token" element={<PublicBatchPage />} />
            <Route path="/d/:rid/:token" element={<PublicDocPage />} />
            <Route path="*" element={<RequireRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);