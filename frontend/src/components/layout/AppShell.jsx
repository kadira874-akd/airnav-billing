import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Plane, LayoutDashboard, FileText, Layers, Settings, LogOut, Moon, Sun, Menu, X, Clock3 } from 'lucide-react';
import { useAuthStore, useUIStore, applyTheme } from '../../store/stores';
import { initials } from '../../lib/format';
import { useClock } from '../../hooks/useClock';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/flights', label: 'Penerbangan', icon: Plane },
  { to: '/batch', label: 'Tagihan Batch', icon: Layers },
  { to: '/master', label: 'Master Data', icon: FileText },
  { to: '/settings', label: 'Pengaturan', icon: Settings },
];

export default function AppShell() {
  const { username, fullName, unitCode, isAdmin, clearAuth } = useAuthStore();
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => applyTheme(theme), [theme]);

  async function handleLogout() {
    try {
      await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', username, token: localStorage.getItem('airnav_token') }),
      });
    } catch {}
    clearAuth();
    localStorage.removeItem('airnav_username');
    localStorage.removeItem('airnav_token');
    navigate('/login');
  }

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] text-white">
      <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center shrink-0">
          <Plane size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold leading-tight">AirNav Billing</div>
          <div className="text-[.58rem] font-semibold tracking-widest text-white/50 uppercase mt-0.5">
            Advance & Extend
          </div>
        </div>
        <button
          className="ml-auto md:hidden text-white/60 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600/40 to-cyan-500/20 text-white border border-brand-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-1.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center text-xs font-extrabold shrink-0">
            {initials(fullName || username)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate">{fullName || username}</div>
            <div className="text-[.6rem] text-white/50 font-semibold tracking-wide">
              {unitCode === 'ALL' ? 'Administrator' : `Unit ${unitCode}`}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-rose-400 transition-colors"
            title="Keluar"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="app-bg" />

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[232px] shrink-0 border-r border-[var(--border-subtle)]">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[8000] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] animate-[rowFade_.2s_ease]">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Topbar() {
  const { theme, toggleTheme, setSidebarOpen } = useUIStore();
  const { fullName, unitCode, username } = useAuthStore();
  const { wita, utc, now } = useClock();
  const activeUnitLabel = unitCode === 'ALL' ? 'Semua Unit' : unitCode;

  return (
    <header className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-topbar,rgba(255,255,255,0.9))] backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-mid)] text-[var(--text-secondary)]"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={17} />
        </button>

        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[var(--text-secondary)]">Live</span>
        </span>

        {/* Unit badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[.62rem] font-bold tracking-wide text-brand-600 bg-brand-600/10 border border-brand-600/25">
          {activeUnitLabel}
          {isAdmin && (
            <span className="px-1.5 py-0.5 rounded bg-brand-600 text-white text-[.55rem]">ADMIN</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Clock */}
        <ClockPanel now={now} wita={wita} utc={utc} />

        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-mid)] transition-all"
          title="Ganti tema"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-[var(--border-subtle)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center text-[.64rem] font-extrabold text-white">
            {initials(fullName || username)}
          </div>
          <div className="hidden lg:block leading-tight">
            <div className="text-xs font-bold text-[var(--text-primary)]">{fullName || username}</div>
            <div className="text-[.6rem] text-[var(--text-tertiary)]">{activeUnitLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ClockPanel({ now, wita, utc }) {
  if (!now) return null;
  return (
    <div className="hidden sm:flex items-baseline gap-2 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <span className="font-mono text-[.78rem] font-bold text-[var(--text-primary)] tabular">{wita}</span>
      <span className="text-[.55rem] font-bold text-[var(--text-tertiary)]">WITA</span>
      <span className="font-mono text-[.7rem] font-semibold text-[var(--text-tertiary)] tabular">{utc}</span>
      <span className="text-[.55rem] text-[var(--text-tertiary)] font-bold">UTC</span>
    </div>
  );
}