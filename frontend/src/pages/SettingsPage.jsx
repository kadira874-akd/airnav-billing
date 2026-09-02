import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Shield, User, Moon, Sun, LogOut, Info } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuthStore, useUIStore } from '../store/stores';
import api from '../lib/apiClient';
import { initials } from '../lib/format';
import { APP_VERSION, APP_NAME } from '../config';

export default function SettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const username = useAuthStore((s) => s.username);
  const fullName = useAuthStore((s) => s.fullName);
  const unitCode = useAuthStore((s) => s.unitCode);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword, confirmPassword);
      toast.success('Password berhasil diperbarui');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.api?.error || err?.message || 'Gagal memperbarui password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await api.logout();
    } catch {
      // lanjutkan logout lokal walau network error
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader
          title="Profil"
          subtitle="Informasi akun Anda"
          icon={<User size={16} />}
        />
        <div className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-600/10 text-brand-600 flex items-center justify-center font-extrabold text-lg shrink-0">
            {initials(fullName || username)}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[var(--text-primary)]">
              {fullName || '—'}
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">@{username}</p>
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[.68rem] font-bold border bg-brand-600/10 text-brand-600 border-brand-600/30">
                <Shield size={12} />
                {unitCode || '—'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Ganti Password"
          subtitle="Perbarui password akun secara berkala"
          icon={<KeyRound size={16} />}
          actions={
            isAdmin ? (
              <span className="text-[.68rem] font-bold text-brand-600">
                Administrator
              </span>
            ) : (
              <span className="text-[.68rem] font-bold text-[var(--text-tertiary)]">
                Unit {unitCode || '—'}
              </span>
            )
          }
        />
        <div className="p-5 space-y-4">
          <Input
            label="Password Lama"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            label="Password Baru"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 text-[.7rem] text-[var(--text-tertiary)]">
            Password minimal 8 karakter, wajib mengandung huruf besar &amp;
            kecil, angka, dan simbol. Tidak boleh mengandung username atau
            password umum.
          </div>
          <div className="flex justify-end">
            <Button loading={loading} onClick={handleChangePassword}>
              Perbarui Password
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Preferensi" subtitle="Tampilan aplikasi" />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={18} className="text-[var(--text-secondary)]" />
              ) : (
                <Sun size={18} className="text-[var(--text-secondary)]" />
              )}
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                </p>
                <p className="text-[.72rem] text-[var(--text-tertiary)]">
                  Pilih tema tampilan aplikasi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer border border-[var(--border-mid)]"
              style={{ background: theme === 'dark' ? 'var(--brand-600)' : 'var(--bg-surface)' }}
              aria-label="Ganti tema"
            >
              <span
                className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                style={{ transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(3px)' }}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Informasi Aplikasi"
          subtitle="Versi dan build aplikasi"
          icon={<Info size={16} />}
        />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoItem label="Nama Aplikasi" value={APP_NAME} />
          <InfoItem label="Versi" value={APP_VERSION} />
          <InfoItem label="Build" value={`${APP_NAME} Web (Web App Apps Script)`} />
        </div>
      </Card>

      <Card>
        <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Keluar dari aplikasi
            </p>
            <p className="text-[.72rem] text-[var(--text-tertiary)]">
              Akhiri sesi dan kembali ke halaman masuk
            </p>
          </div>
          <Button
            variant="danger"
            loading={logoutLoading}
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            <LogOut size={15} /> Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
