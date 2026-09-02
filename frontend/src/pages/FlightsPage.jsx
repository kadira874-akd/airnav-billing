import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  CheckCircle2,
  ClipboardCheck,
  Download,
} from 'lucide-react';
import { useUnitData, useFlightMutations } from '../hooks/useQueries';
import { useToast } from '../components/ui/Toast';
import { useAuthStore, useUIStore } from '../store/stores';
import { UNITS, STATUS } from '../config';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Input, Select, TextArea } from '../components/ui/Input';
import TableSkeleton from '../components/ui/TableSkeleton';
import EmptyState from '../components/ui/EmptyState';
import PdfPreview from '../components/PdfPreview';
import { fmtRupiah, fmtDate, fmtTime } from '../lib/format';

const TABS = [
  { key: STATUS.VALIDATION, label: 'Validasi' },
  { key: STATUS.INVOICED, label: 'Invoiced' },
  { key: STATUS.UNPAID, label: 'Belum Bayar' },
  { key: STATUS.PAID, label: 'Lunas' },
];

const DEP_ARR = ['DEP', 'ARR'];
const CATEGORIES = ['EXTEND', 'ADVANCE'];
const DOM_INTS = ['DOMESTIK', 'INTERNATIONAL'];
const HISTORY_KEY = 'flights_status_tab';

const emptyForm = {
  unitCode: '',
  flightDate: '',
  acid: '',
  registration: '',
  aircraftType: '',
  adep: '',
  ades: '',
  dep_arr_loc: 'DEP',
  atd: '',
  ata: '',
  category: 'EXTEND',
  duration: '',
  domInt: 'DOMESTIK',
};

export default function FlightsPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const authUnit = useAuthStore((s) => s.unitCode);
  const activeUnit = useUIStore((s) => s.activeUnit);
  const setActiveUnit = useUIStore((s) => s.setActiveUnit);
  const toast = useToast();

  const [statusTab, setStatusTab] = useState(
    () => localStorage.getItem(HISTORY_KEY) || STATUS.VALIDATION
  );
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('flightDate');
  const [sortDir, setSortDir] = useState('asc');

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [validateTarget, setValidateTarget] = useState(null);
  const [validateResult, setValidateResult] = useState(null);
  const [manualKurs, setManualKurs] = useState('');
  const [usePpn, setUsePpn] = useState(true);
  const [usePph, setUsePph] = useState(true);
  const [validateLoading, setValidateLoading] = useState(false);

  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [previewTarget, setPreviewTarget] = useState(null);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, statusTab);
  }, [statusTab]);

  useEffect(() => {
    if (!activeUnit) {
      setActiveUnit(isAdmin ? 'ALL' : authUnit || UNITS[0]);
    }
  }, [activeUnit, isAdmin, authUnit, setActiveUnit]);

  const { data: unitRes, isLoading, isError, refetch } = useUnitData(activeUnit);

  const flights = useMemo(() => unitRes?.data || [], [unitRes]);
  const mutations = useFlightMutations();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = flights.filter((f) => f.statusFlow === statusTab);
    if (term) {
      list = list.filter(
        (f) =>
          String(f.acid || '').toLowerCase().includes(term) ||
          String(f.registration || '').toLowerCase().includes(term) ||
          String(f.invoiceNo || '').toLowerCase().includes(term)
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const an = parseFloat(av);
      const bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [flights, statusTab, search, sortKey, sortDir]);

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach((t) => (counts[t.key] = 0));
    flights.forEach((f) => {
      if (counts[f.statusFlow] !== undefined) counts[f.statusFlow] += 1;
    });
    return counts;
  }, [flights]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({
      ...emptyForm,
      unitCode: isAdmin
        ? activeUnit === 'ALL'
          ? UNITS[0]
          : activeUnit
        : authUnit,
    });
    setFormOpen(true);
  };

  const openEdit = (f) => {
    setEditTarget(f);
    setForm({
      unitCode: f.unitCode,
      flightDate: f.flightDate || '',
      acid: f.acid || '',
      registration: f.registration || '',
      aircraftType: f.aircraftType || '',
      adep: f.adep || '',
      ades: f.ades || '',
      dep_arr_loc: f.dep_arr_loc || 'DEP',
      atd: f.atd || '',
      ata: f.ata || '',
      category: f.category || 'EXTEND',
      duration: f.duration != null ? f.duration : '',
      domInt: f.domInt || 'DOMESTIK',
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      duration: form.duration === '' ? 0 : Number(form.duration),
    };
    const unitCode = form.unitCode;
    if (editTarget) {
      mutations.updateFlight.mutate(
        { rid: editTarget.rowId, updates: payload, unitCode },
        {
          onSuccess: () => {
            toast.success('Data penerbangan diperbarui');
            setFormOpen(false);
          },
          onError: (e) => toast.error(e?.message || 'Gagal memperbarui data'),
        }
      );
    } else {
      mutations.saveFlight.mutate(
        { ...payload, statusFlow: STATUS.VALIDATION },
        {
          onSuccess: () => {
            toast.success('Penerbangan ditambahkan');
            setFormOpen(false);
          },
          onError: (e) => toast.error(e?.message || 'Gagal menambah penerbangan'),
        }
      );
    }
  };

  const handleDelete = (f) => {
    mutations.deleteFlight.mutate(
      { rid: f.rowId, unitCode: f.unitCode },
      {
        onSuccess: () => toast.success('Penerbangan dihapus'),
        onError: (e) => toast.error(e?.message || 'Gagal menghapus data'),
      }
    );
  };

  const handleMarkPaid = (f) => {
    mutations.updateStatus.mutate(
      { rid: f.rowId, newStatus: STATUS.PAID, unitCode: f.unitCode },
      {
        onSuccess: () => toast.success('Ditandai lunas'),
        onError: (e) => toast.error(e?.message || 'Gagal menandai lunas'),
      }
    );
  };

  const openValidate = (f) => {
    setValidateTarget(f);
    setValidateResult(null);
    setManualKurs('');
    setUsePpn(true);
    setUsePph(true);
  };

  const handleValidate = () => {
    if (!validateTarget) return;
    setValidateLoading(true);
    mutations.validateFlight.mutate(
      {
        rid: validateTarget.rowId,
        manualKurs: manualKurs === '' ? null : Number(manualKurs),
        usePpn,
        usePph,
        unitCode: validateTarget.unitCode,
      },
      {
        onSuccess: (res) => {
          setValidateLoading(false);
          setValidateResult(res);
          toast.success('Penerbangan tervalidasi dan invoice dibuat');
        },
        onError: (e) => {
          setValidateLoading(false);
          toast.error(e?.message || 'Validasi gagal');
        },
      }
    );
  };

  const handleVoid = () => {
    if (!voidTarget) return;
    mutations.voidInvoice.mutate(
      { rid: voidTarget.rowId, reason: voidReason, unitCode: voidTarget.unitCode },
      {
        onSuccess: () => {
          toast.success('Invoice dibatalkan');
          setVoidTarget(null);
          setVoidReason('');
        },
        onError: (e) => toast.error(e?.message || 'Gagal membatalkan invoice'),
      }
    );
  };

  const canVoid = mutations.voidInvoice.isPending;

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Penerbangan"
          subtitle="Kelola dan validasi data penerbangan"
          actions={
            <Button size="sm" onClick={openAdd}>
              <Plus size={15} /> Tambah Flight
            </Button>
          }
        />

        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {['ALL', ...UNITS].map((u) => (
              <button
                key={u}
                onClick={() => setActiveUnit(u)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                  activeUnit === u
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/30'
                    : 'border-[var(--border-mid)] text-[var(--text-secondary)] hover:bg-[var(--table-hover)] hover:text-[var(--text-primary)]'
                )}
              >
                {u === 'ALL' ? 'Semua Unit' : u}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusTab(t.key)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer',
                    statusTab === t.key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {t.label}
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded-full text-[.62rem] font-bold',
                      statusTab === t.key
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--table-hover)] text-[var(--text-secondary)]'
                    )}
                  >
                    {tabCounts[t.key] || 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Cari ACID, reg, atau no. invoice…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton columns={isAdmin ? 12 : 11} />
          ) : isError ? (
            <EmptyState
              title="Gagal memuat data"
              subtitle="Terjadi kesalahan saat mengambil data penerbangan."
              onRefresh={refetch}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada data"
              subtitle={'Tidak ada penerbangan pada tab ' + (TABS.find((t) => t.key === statusTab)?.label || statusTab) + '.'}
              onRefresh={refetch}
            />
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm min-w-[880px]">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="px-3 py-2.5 text-left text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)] w-10">
                      No
                    </th>
                    <SortHeader label="Tanggal" k="flightDate" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    <SortHeader label="ACID" k="acid" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    <th className="px-3 py-2.5 text-left text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Reg / Tipe
                    </th>
                    <SortHeader label="Route" k="adep" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    <th className="px-3 py-2.5 text-left text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Waktu
                    </th>
                    <th className="px-3 py-2.5 text-left text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Kategori
                    </th>
                    <SortHeader label="Durasi" k="duration" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    <SortHeader label="Nominal" k="totalAmount" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    {isAdmin && (
                      <th className="px-3 py-2.5 text-left text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Unit
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-right text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => (
                    <tr
                      key={f.rowId}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--table-hover)] transition-colors"
                    >
                      <td className="px-3 py-3 text-[var(--text-tertiary)] text-xs">
                        {i + 1}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{fmtDate(f.flightDate)}</td>
                      <td className="px-3 py-3 font-bold text-[var(--text-primary)]">
                        {f.acid || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[var(--text-primary)] text-xs">
                          {f.registration || '—'}
                        </div>
                        <div className="text-[var(--text-tertiary)] text-[.68rem]">
                          {f.aircraftType || ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="font-semibold">{f.adep || '—'}</span>
                        <span className="text-[var(--text-tertiary)] mx-1">→</span>
                        <span className="font-semibold">{f.ades || '—'}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-xs text-[var(--text-primary)]">
                          {f.dep_arr_loc || ''}
                        </div>
                        <div className="text-[.68rem] text-[var(--text-tertiary)]">
                          {fmtTime(f.atd)} {f.ata ? '/' + fmtTime(f.ata) : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge status={f.category} />
                          <Badge status={f.domInt === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'DOMESTIK'} />
                        </div>
                      </td>
                      <td className="px-3 py-3">{f.duration ?? '—'}</td>
                      <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">
                        {f.totalAmount ? fmtRupiah(f.totalAmount) : '—'}
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          <Badge status="DOMESTIK" label={f.unitCode} />
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <RowActions
                          f={f}
                          isAdmin={isAdmin}
                          authUnit={authUnit}
                          canEdit={f.statusFlow === STATUS.VALIDATION && (isAdmin || f.unitCode === authUnit)}
                          onValidate={openValidate}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                          onMarkPaid={handleMarkPaid}
                          onVoid={setVoidTarget}
                          onPreview={setPreviewTarget}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit Penerbangan' : 'Tambah Penerbangan'}
        maxWidth="720px"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Unit"
            value={form.unitCode}
            onChange={(e) => setForm({ ...form, unitCode: e.target.value })}
            disabled={!isAdmin}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
          <Input
            label="Tanggal"
            type="date"
            value={form.flightDate}
            onChange={(e) => setForm({ ...form, flightDate: e.target.value })}
          />
          <Input
            label="Callsign (ACID)"
            value={form.acid}
            onChange={(e) => setForm({ ...form, acid: e.target.value })}
          />
          <Input
            label="Registrasi"
            value={form.registration}
            onChange={(e) => setForm({ ...form, registration: e.target.value })}
          />
          <Input
            label="Tipe Pesawat"
            value={form.aircraftType}
            onChange={(e) => setForm({ ...form, aircraftType: e.target.value })}
          />
          <Input
            label="ADEP"
            value={form.adep}
            onChange={(e) => setForm({ ...form, adep: e.target.value })}
          />
          <Input
            label="ADES"
            value={form.ades}
            onChange={(e) => setForm({ ...form, ades: e.target.value })}
          />
          <Select
            label="Keberangkatan / Kedatangan"
            value={form.dep_arr_loc}
            onChange={(e) => setForm({ ...form, dep_arr_loc: e.target.value })}
          >
            {DEP_ARR.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Input
            label="Atd"
            type="time"
            value={form.atd}
            onChange={(e) => setForm({ ...form, atd: e.target.value })}
          />
          <Input
            label="Ata"
            type="time"
            value={form.ata}
            onChange={(e) => setForm({ ...form, ata: e.target.value })}
          />
          <Select
            label="Kategori"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Input
            label="Durasi (menit)"
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
          <Select
            label="Domestik / Internasional"
            value={form.domInt}
            onChange={(e) => setForm({ ...form, domInt: e.target.value })}
          >
            {DOM_INTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={() => setFormOpen(false)}>
            Batal
          </Button>
          <Button
            variant="primary"
            loading={mutations.saveFlight.isPending || mutations.updateFlight.isPending}
            onClick={handleSubmit}
          >
            {editTarget ? 'Simpan Perubahan' : 'Simpan Flight'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!validateTarget}
        onClose={() => setValidateTarget(null)}
        title="Validasi Penerbangan"
        maxWidth="560px"
      >
        {validateTarget && !validateResult && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <InfoItem label="ACID" value={validateTarget.acid} />
              <InfoItem label="Tanggal" value={fmtDate(validateTarget.flightDate)} />
              <InfoItem label="Route" value={`${validateTarget.adep} → ${validateTarget.ades}`} />
              <InfoItem
                label="Waktu"
                value={`${validateTarget.dep_arr_loc || ''} ${fmtTime(validateTarget.atd)} / ${fmtTime(validateTarget.ata)}`}
              />
              <InfoItem label="Kategori" value={validateTarget.category} />
              <InfoItem label="Durasi" value={validateTarget.duration ?? ''} />
            </div>

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={usePpn}
                  onChange={(e) => setUsePpn(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                Gunakan PPN
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={usePph}
                  onChange={(e) => setUsePph(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                Gunakan PPh
              </label>
            </div>

            <Input
              label="Kurs USD Manual (kosong = otomatis)"
              type="number"
              placeholder="15000"
              value={manualKurs}
              onChange={(e) => setManualKurs(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setValidateTarget(null)}>
                Batal
              </Button>
              <Button
                variant="primary"
                loading={validateLoading || mutations.validateFlight.isPending}
                onClick={handleValidate}
              >
                <ClipboardCheck size={15} /> Validasi & Buat Invoice
              </Button>
            </div>
          </div>
        )}

        {validateResult && (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                Validasi berhasil
              </p>
              <p className="text-[.72rem] text-[var(--text-tertiary)]">
                Invoice telah dibuat untuk {validateTarget.acid}.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 space-y-2">
              <InfoItem label="No. Invoice" value={validateResult.invoiceNo} />
              <InfoItem label="Kurs" value={validateResult.kursUsed} />
              <InfoItem label="Gross" value={fmtRupiah(validateResult.grossAmount)} />
              <InfoItem label="PPN" value={fmtRupiah(validateResult.vatAmount)} />
              <InfoItem label="PPh" value={fmtRupiah(validateResult.pphAmount)} />
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <InfoItem label="Total" value={fmtRupiah(validateResult.totalAmount)} bold />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setValidateTarget(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        title="Batalkan Invoice"
        maxWidth="480px"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Batalkan invoice untuk <span className="font-bold text-[var(--text-primary)]">{voidTarget?.acid}</span> (No. {voidTarget?.invoiceNo || '—'})?
          </p>
          <TextArea
            label="Alasan pembatalan"
            placeholder="Minimal 5 karakter…"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setVoidTarget(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              loading={canVoid}
              disabled={voidReason.trim().length < 5}
              onClick={handleVoid}
            >
              <Trash2 size={15} /> Void Invoice
            </Button>
          </div>
        </div>
      </Modal>

      <PdfPreview
        flight={previewTarget}
        open={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  );
}

function SortHeader({ label, k, sortKey, sortDir, onToggle, className }) {
  return (
    <th
      className={clsx(
        'px-3 py-2.5 text-left text-[.68rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)] cursor-pointer select-none whitespace-nowrap hover:text-[var(--text-primary)] transition-colors',
        className
      )}
      onClick={() => onToggle(k)}
    >
      {label}
      <span className="ml-1 inline-block text-[var(--text-tertiary)]">
        {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : ''}
      </span>
    </th>
  );
}

function InfoItem({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[.7rem] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
        {label}
      </span>
      <span
        className={clsx(
          'text-sm text-right',
          bold ? 'font-extrabold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-primary)]'
        )}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

function RowActions({ f, isAdmin, authUnit, canEdit, onValidate, onEdit, onDelete, onMarkPaid, onVoid, onPreview }) {
  const icons = 'p-1.5 rounded-md transition-colors cursor-pointer';
  const styles = {
    validate: 'text-brand-600 hover:bg-brand-600/10',
    edit: 'text-[var(--text-secondary)] hover:bg-[var(--table-hover)] hover:text-brand-600',
    delete: 'text-rose-500 hover:bg-rose-500/10',
    paid: 'text-emerald-600 hover:bg-emerald-600/10',
    void: 'text-rose-500 hover:bg-rose-500/10',
  };
  return (
    <div className="flex items-center justify-end gap-1">
      {f.statusFlow === STATUS.VALIDATION && isAdmin && (
        <button
          title="Validasi"
          className={clsx(icons, styles.validate)}
          onClick={() => onValidate(f)}
        >
          <FileText size={15} />
        </button>
      )}
      {canEdit && (
        <button
          title="Edit"
          className={clsx(icons, styles.edit)}
          onClick={() => onEdit(f)}
        >
          <Pencil size={15} />
        </button>
      )}
      {f.statusFlow === STATUS.VALIDATION && (isAdmin || f.unitCode === authUnit) && (
        <button
          title="Hapus"
          className={clsx(icons, styles.delete)}
          onClick={() => onDelete(f)}
        >
          <Trash2 size={15} />
        </button>
      )}
      {(f.statusFlow === STATUS.INVOICED || f.statusFlow === STATUS.UNPAID || f.statusFlow === STATUS.PAID) && (
        <button
          title="Preview Invoice / Kwitansi"
          className={clsx(icons, 'text-[var(--text-secondary)] hover:bg-[var(--table-hover)] hover:text-brand-600')}
          onClick={() => onPreview(f)}
        >
          <Download size={15} />
        </button>
      )}
      {f.statusFlow === STATUS.UNPAID && (
        <button
          title="Tandai lunas"
          className={clsx(icons, styles.paid)}
          onClick={() => onMarkPaid(f)}
        >
          <CheckCircle2 size={15} />
        </button>
      )}
      {(f.statusFlow === STATUS.INVOICED || f.statusFlow === STATUS.UNPAID) && isAdmin && (
        <button
          title="Void / Batalkan"
          className={clsx(icons, styles.void)}
          onClick={() => onVoid(f)}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
