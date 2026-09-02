import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── AUTH STORE ────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      username: '',
      token: '',
      fullName: '',
      unitCode: '',
      isAdmin: false,
      user: null,
      setAuth: (payload) =>
        set({
          username: payload?.username || '',
          token: payload?.token || '',
          fullName: payload?.fullName || '',
          unitCode: payload?.unitCode || '',
          isAdmin: String(payload?.unitCode || '').toUpperCase() === 'ALL',
          user: payload || null,
        }),
      clearAuth: () =>
        set({
          username: '',
          token: '',
          fullName: '',
          unitCode: '',
          isAdmin: false,
          user: null,
        }),
    }),
    {
      name: 'airnav_auth',
      partialize: (state) => ({
        username: state.username,
        token: state.token,
        fullName: state.fullName,
        unitCode: state.unitCode,
        isAdmin: state.isAdmin,
      }),
    }
  )
);

// ── UI STORE ──────────────────────────────────────────────────
export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'light' ? 'dark' : 'light';
          localStorage.setItem('airnav_theme', next);
          return { theme: next };
        }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      activeUnit: '',
      setActiveUnit: (unit) => set({ activeUnit: unit }),
    }),
    {
      name: 'airnav_ui',
      partialize: (s) => ({ theme: s.theme, activeUnit: s.activeUnit }),
    }
  )
);

// Terapkan theme ke <html data-theme>
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}