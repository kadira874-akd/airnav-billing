import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Globe,
  Layers,
} from 'lucide-react';
import { useDashboard } from '../hooks/useQueries';
import { Card, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import TableSkeleton from '../components/ui/TableSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { fmtRupiah, fmtDate } from '../lib/format';
import { UNITS } from '../config';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const [selectedYear, setSelectedYear] = useState('all');

  const dash = data?.data;

  const kpis = useMemo(() => {
    if (!dash?.kpi) return [];
    const k = dash.kpi;
    return [
      { label: 'Total Data', value: k.totalData, icon: <Plane size={20} />, color: 'from-brand-600 to-cyan-500' },
      { label: 'Terinvoice', value: k.totalInvoice, icon: <FileText size={20} />, color: 'from-indigo-600 to-blue-500' },
      { label: 'Belum Bayar', value: k.totalPending, icon: <Clock size={20} />, color: 'from-orange-500 to-rose-500' },
      { label: 'Lunas', value: k.totalPaid, icon: <CheckCircle2 size={20} />, color: 'from-emerald-600 to-teal-500' },
    ];
  }, [dash]);

  const revenueStats = useMemo(() => {
    if (!dash?.kpi) return { nominal: 0, revenue: 0, ext: 0, adv: 0, dom: 0, int: 0 };
    const k = dash.kpi;
    return {
      nominal: k.totalNominal || 0,
      revenue: k.totalRevenue || 0,
      ext: k.extCount || 0,
      adv: k.advCount || 0,
      dom: k.domCount || 0,
      int: k.intCount || 0,
    };
  }, [dash]);

  const recentFlights = useMemo(() => {
    if (!dash?.byYear) return [];
    const all = [];
    Object.values(dash.byYear).forEach((yr) => {
      (yr.flights || []).forEach((f) => all.push(f));
    });
    return all
      .slice()
      .sort((a, b) => String(b.flightDate || '').localeCompare(String(a.flightDate || '')))
      .slice(0, 10);
  }, [dash]);

  const unitRows = dash?.kpi?.unitResumes || [];

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <PageHeading title="Dashboard" subtitle="Ringkasan kinerja AirNav Advance & Extend" />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[96px] rounded-xl" />)
          : kpis.map((k) => (
              <div key={k.label} className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 md:p-5 shadow-[var(--shadow-card)]">
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br opacity-10 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {k.label}
                  </span>
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br ${k.color} text-white`}>
                    {k.icon}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-extrabold tabular text-[var(--text-primary)]">
                  {typeof k.value === 'number' ? k.value.toLocaleString('id-ID') : '0'}
                </div>
                {/* mini bar */}
                <div className="mt-2 h-0.5 rounded bg-[var(--border-subtle)] overflow-hidden">
                  <div className={`h-full w-1/2 bg-gradient-to-r ${k.color}`} />
                </div>
              </div>
            ))}
      </div>

      {/* ── Revenue + Distribution ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader title="Realisasi" subtitle="Nominal total & pendapatan masuk" icon={<Wallet size={16} />} />
          <div className="p-5 space-y-4">
            <div>
              <div className="text-[.7rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Total Nominal</div>
              <div className="text-xl font-extrabold text-[var(--text-primary)] tabular mt-1">
                {fmtRupiah(revenueStats.nominal)}
              </div>
            </div>
            <div>
              <div className="text-[.7rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Pendapatan Terbayar</div>
              <div className="flex items-center gap-2 text-xl font-extrabold text-emerald-600 tabular mt-1">
                {fmtRupiah(revenueStats.revenue)}
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <Stat mini label="EXTEND" value={revenueStats.ext} color="text-orange-500" />
              <Stat mini label="ADVANCE" value={revenueStats.adv} color="text-purple-500" />
              <Stat mini label="Domestik" value={revenueStats.dom} color="text-brand-600" />
              <Stat mini label="Internasional" value={revenueStats.int} color="text-teal-500" />
            </div>
          </div>
        </Card>

        {/* ── Distribution bars ── */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Distribusi Penerbangan"
            subtitle="Berdasarkan kategori & rute"
            icon={<Layers size={16} />}
          />
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DistBars title="Kategori" total={revenueStats.ext + revenueStats.adv} colorA="oklch(0.7 0.16 35)" colorB="oklch(0.7 0.15 310)">
              <DistBar label="EXTEND" value={revenueStats.ext} total={revenueStats.ext + revenueStats.adv} color="bg-orange-500" />
              <DistBar label="ADVANCE" value={revenueStats.adv} total={revenueStats.ext + revenueStats.adv} color="bg-purple-500" />
            </DistBars>
            <DistBars title="Rute" total={revenueStats.dom + revenueStats.int} colorA="oklch(0.65 0.2 245)" colorB="oklch(0.7 0.15 190)">
              <DistBar label="Domestik" value={revenueStats.dom} total={revenueStats.dom + revenueStats.int} color="bg-brand-600" />
              <DistBar label="Internasional" value={revenueStats.int} total={revenueStats.dom + revenueStats.int} color="bg-teal-500" />
            </DistBars>
          </div>
        </Card>
      </div>

      {/* ── Per-Unit table ── */}
      <Card>
        <CardHeader
          title="Kinerja per Unit"
          subtitle="Validasi, invoice, kwitansi, dan pendapatan tiap unit"
          icon={<Globe size={16} />}
        />
        {isLoading ? (
          <TableSkeleton columns={7} />
        ) : isError || unitRows.length === 0 ? (
          <EmptyState title="Belum ada data" subtitle="Data penerbangan belum tersedia." onRefresh={refetch} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[.68rem] uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
                  <th className="px-5 py-3 font-bold">Unit</th>
                  <th className="px-4 py-3 font-bold">Validasi</th>
                  <th className="px-4 py-3 font-bold">Invoice</th>
                  <th className="px-4 py-3 font-bold">Kwitansi</th>
                  <th className="px-4 py-3 font-bold">Lunas</th>
                  <th className="px-4 py-3 font-bold text-right">Nominal</th>
                  <th className="px-4 py-3 font-bold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {unitRows.map((r) => (
                  <tr key={r.unit} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--table-hover)] transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-[var(--text-primary)]">{r.unit}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular"><Badge status="VALIDATION" label={String(r.validation)} /></td>
                    <td className="px-4 py-3 tabular"><Badge status="INVOICED" label={String(r.invoice)} /></td>
                    <td className="px-4 py-3 tabular"><Badge status="UNPAID" label={String(r.kwitansi)} /></td>
                    <td className="px-4 py-3 tabular"><Badge status="PAID" label={String(r.paid)} /></td>
                    <td className="px-4 py-3 text-right tabular text-[var(--text-secondary)]">{fmtRupiah(r.nominal)}</td>
                    <td className="px-4 py-3 text-right tabular font-semibold text-emerald-600">{fmtRupiah(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Recent flights ── */}
      <Card>
        <CardHeader
          title="Penerbangan Terbaru"
          subtitle="10 data terakhir berdasarkan tanggal"
          icon={<Plane size={16} />}
          actions={
            <Link to="/flights" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
              Lihat Semua <ArrowUpRight size={14} />
            </Link>
          }
        />
        {isLoading ? (
          <TableSkeleton columns={6} />
        ) : recentFlights.length === 0 ? (
          <EmptyState title="Belum ada flight" subtitle="Mulai input penerbangan pada halaman Penerbangan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[.68rem] uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
                  <th className="px-5 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 font-bold">Unit</th>
                  <th className="px-4 py-3 font-bold">ACID</th>
                  <th className="px-4 py-3 font-bold">No. Invoice</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentFlights.map((f, i) => (
                  <tr key={f.rowId || i} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--table-hover)] transition-colors row-enter">
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{fmtDate(f.flightDate)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)] text-xs">{f.unitCode}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)]">{f.acid}</td>
                    <td className="px-4 py-3 font-mono text-[.8rem] text-[var(--text-secondary)]">{f.invoiceNo || '—'}</td>
                    <td className="px-4 py-3"><Badge status={f.statusFlow} /></td>
                    <td className="px-4 py-3 text-right tabular font-semibold text-[var(--text-primary)]">{fmtRupiah(f.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function PageHeading({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{title}</h1>
      <p className="text-[.8rem] text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div className="text-[.64rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
      <div className={`text-lg font-extrabold tabular mt-0.5 ${color}`}>{value || 0}</div>
    </div>
  );
}

function DistBars({ title, total, colorA, colorB, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[.72rem] font-bold text-[var(--text-secondary)]">{title}</span>
        <span className="text-[.7rem] text-[var(--text-tertiary)] font-semibold tabular">{total || 0} flight</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function DistBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        <span className="text-xs font-bold tabular text-[var(--text-primary)]">{value} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}