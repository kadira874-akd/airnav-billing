import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuthStore, useUIStore } from '../store/stores';
import api from '../lib/apiClient';
import { APP_VERSION, APP_NAME } from '../config';

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setActiveUnit = useUIStore((s) => s.setActiveUnit);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockError, setLockError] = useState('');
  const [conflict, setConflict] = useState(null);

  const applyAuth = (data, forceData) => {
    const d = forceData || data;
    const unitCode = d.unitCode;
    setAuth({
      username: d.username || username,
      token: d.token,
      fullName: d.fullName,
      unitCode,
    });
    if (d.token) localStorage.setItem('airnav_token', d.token);
    if (d.username) localStorage.setItem('airnav_username', d.username);
    setActiveUnit(unitCode === 'ALL' ? 'ALL' : unitCode);
    navigate('/', { replace: true });
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      toast.error('Username dan password wajib diisi');
      return;
    }
    setLoading(true);
    setLockError('');
    setConflict(null);
    try {
      const data = await api.login(username.trim(), password);
      applyAuth(data);
    } catch (err) {
      const apiErr = err?.api;
      if (apiErr?.locked) {
        setLockError(
          apiErr.error ||
            'Akun terkunci. Hubungi administrator untuk membuka akses.'
        );
      } else if (apiErr?.concurrent && apiErr?.canForce) {
        setConflict({
          message: apiErr.error || 'Akun masih aktif di perangkat lain.',
          forceError: '',
        });
      } else {
        toast.error(err?.message || apiErr?.error || 'Gagal masuk');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForce = async () => {
    setLoading(true);
    try {
      const data = await api.forceLogin(username.trim(), password);
      applyAuth(data);
    } catch (err) {
      const msg =
        err?.api?.error || err?.message || 'Gagal mengambil alih sesi';
      setConflict((c) => ({ ...c, forceError: msg }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'var(--gradient-mesh, radial-gradient(at 20% 20%, #1e5ff0 0, transparent 50%), radial-gradient(at 80% 20%, #7c3aed 0, transparent 50%), radial-gradient(at 50% 80%, #0ea5e9 0, transparent 55%), #0b1220)',
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/40 mb-4">
              <Plane size={28} />
            </div>
            <h1 className="text-xl font-extrabold text-[var(--text-primary)]">
              {APP_NAME}
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Advance &amp; Extend Billing System
            </p>
          </div>

          {lockError && (
            <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
              {lockError}
            </div>
          )}

          {conflict ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-start gap-3">
                <div>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-300">
                    Akun masih aktif
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {conflict.message}
                  </p>
                </div>
              </div>
              {conflict.forceError && (
                <p className="text-sm text-rose-500">{conflict.forceError}</p>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  loading={loading}
                  onClick={handleForce}
                >
                  Pakai Perangkat Ini (ganti sesi)
                </Button>
                <Button
                  variant="ghost"
                  disabled={loading}
                  onClick={() => setConflict(null)}
                >
                  Kembali
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                autoFocus
                autoComplete="username"
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[34px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Masuk
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-tertiary)] mt-4 opacity-80">
          {APP_NAME} v{APP_VERSION}
        </p>
      </div>
    </div>
  );
}
