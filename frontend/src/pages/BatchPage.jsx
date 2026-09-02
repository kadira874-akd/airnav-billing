import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Layers,
  Link2,
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Upload,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUnitData } from '../hooks/useQueries';
import api from '../lib/apiClient';
import { useToast } from '../components/ui/Toast';
import { useAuthStore, useUIStore } from '../store/stores';
import { UNITS, BATCH_STATUS } from '../config';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Input, TextArea, Select } from '../components/ui/Input';
import TableSkeleton from '../components/ui/TableSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { fmtRupiah, fmtDate, fmtDateTime, batchStatusLabel } from '../lib/format';

const TABS = [
  { key: 'create', label: 'Buat Tagihan Batch' },
  { key: 'history', label: 'Riwayat Batch' },
];

const PUBLIC_ORIGIN = 'https://airnav-billing.vercel.app';

export function buildBatchUrl(batchId, token) {
  return `${PUBLIC_ORIGIN}/b/${batchId}/${token}`;
}

export default function BatchPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const authUnit = useAuthStore((s) => s.unitCode);
  const activeUnit = useUIStore((s) => s.activeUnit);
  const setActiveUnit = useUIStore((s) => s.setActiveUnit);

  const [tab, setTab] = useState('create');
  const [selectedIds, setSelectedIds] = useState([]);

  const [successModal, setSuccessModal] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);

  useEffect(() => {
    if (!activeUnit) {
      setActiveUnit(isAdmin ? 'ALL' : authUnit || UNITS[0]);
    }
  }, [activeUnit, isAdmin, authUnit, setActiveUnit]);

  useEffect(() => setSelectedIds([]), [activeUnit]);

  const currentUnit = activeUnit === 'ALL' ? '' : activeUnit;
  const { data: unitRes, isLoading: flightsLoading, refetch: refetchUnit } = useUnitData(currentUnit);
  const flights = useMemo(() => unitRes?.data || [], [unitRes]);

  const billable = useMemo(() => {
    return flights.filter(
      (f) => String(f.status || '').toUpperCase() === BATCH_STATUS.ACTIVE ||
        ['INVOICED', 'UNPAID'].includes(String(f.status || '').toUpperCase())
    );
  }, [flights]);

  const selectedTotal = useMemo(() => {
    return billable
      .filter((f) => selectedIds.includes(f.rid))
      .reduce((sum, f) => sum + (parseFloat(f.grandAmount ?? f.grandTotal) || 0), 0);
  }, [billable, selectedIds]);

  const toggle = (rid) =>
    setSelectedIds((prev) =>
      prev.includes(rid) ? prev.filter((x) => x !== rid) : [...prev, rid]
    );

  const { data: batchesData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      if (isAdmin) {
        return api.batchesByIds(['ALL']);
      }
      const res = await api.batchesByIds([authUnit]).catch(() => null);
      if (res && Array.isArray(res)) return res;
      const mine = await api.batchesByIds([]).catch(() => null);
      return Array.isArray(mine) ? mine : [];
    },
    enabled: tab === 'history',
    staleTime: 15_000,
  });

  const batches = useMemo(() => (Array.isArray(batchesData) ? batchesData : []), [batchesData]);

  const generate = useMutation({
    mutationFn: (rowIds) => api.generateBatch(rowIds),
    onSuccess: (res) => {
      const url = res?.url || buildBatchUrl(res?.batchId, res?.token);
      setSuccessModal({ ...res, url });
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e.message || 'Gagal membuat link batch'),
  });

  const verify = useMutation({
    mutationFn: (batchId) => api.verifyBatch(batchId),
    onSuccess: () => {
      toast.success('Batch berhasil diverifikasi');
      setVerifyTarget(null);
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e.message || 'Gagal verifikasi batch'),
  });

  const reject = useMutation({
    mutationFn: ({ batchId, reason }) => api.rejectBatch(batchId, { reason, category: 'LAIN' }),
    onSuccess: () => {
      toast.success('Batch ditolak');
      setRejectTarget(null);
      setRejectReason('');
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e.message || 'Gagal menolak batch'),
  });

  const detailQuery = useQuery({
    queryKey: ['batchDetail', detailTarget?.batchId],
    queryFn: async () => {
      const rowIds = detailTarget?.rowIds || [];
      const [detail, flightsRes] = await Promise.all([
        detailTarget?.data
          ? Promise.resolve({ data: detailTarget.data })
          : api.batchData(detailTarget.batchId, detailTarget.token).catch(() => null),
        rowIds.length ? api.flightsByRowIds(rowIds).catch(() => []) : Promise.resolve([]),
      ]);
      return {
        detail: detail?.data || detailTarget?.data || {},
        flights: Array.isArray(flightsRes) ? flightsRes : [],
      };
    },
    enabled: !!detailTarget,
  });

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link disalin');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const openPortal = (batch) => {
    const url = buildBatchUrl(batch.batchId, batch.token);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const flightRowLabel = (f) =>
    [
      f?.airlineCode,
      f?.flightNo,
      f?.acid,
      f?.registration,
      `${f?.adep || ''}-${f?.ades || ''}`,
    ]
      .filter(Boolean)
      .join(' ');
  const flightAmount = (f) => parseFloat(f?.grandAmount ?? f?.grandTotal) || 0;

  const renderFlightTable = (rows, { checkbox = false } = {}) => (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[.64rem] uppercase tracking-wider text-[var(--text-tertiary)]">
            {checkbox && <th className="px-3 py-2 w-8"><span className="sr-only">Pilih</span></th>}
            {['Penerbangan', 'Maskapai', 'Rute', 'Tanggal', 'Total'].map((h) => (
              <th key={h} className="px-3 py-2 font-bold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.rid} className="border-t border-[var(--border-subtle)] hover:bg-[var(--table-hover)]">
              {checkbox && (
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                    checked={selectedIds.includes(f.rid)}
                    onChange={() => toggle(f.rid)}
                  />
                </td>
              )}
              <td className="px-3 py-2 font-semibold text-[var(--text-primary)] whitespace-nowrap">
                {flightRowLabel(f)}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{f?.airlineCode || '-'}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">
                {f?.adep || '-'} → {f?.ades || '-'}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">
                {fmtDate(f?.flightDate || f?.createdAt)}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                {fmtRupiah(flightAmount(f))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDetail = () => {
    if (detailQuery.isLoading) return <TableSkeleton columns={4} />;
    const { detail = {}, flights: detailFlights = [] } = detailQuery.data || {};
    const status = detail.status;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[.64rem] uppercase tracking-wider text-[var(--text-tertiary)]">Status</p>
            <div className="mt-1"><Badge status={status} label={batchStatusLabel(status)} /></div>
          </div>
          <div>
            <p className="text-[.64rem] uppercase tracking-wider text-[var(--text-tertiary)]">Operator</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{detail.operatorName || detail.createdBy || '-'}</p>
          </div>
          <div>
            <p className="text-[.64rem] uppercase tracking-wider text-[var(--text-tertiary)]">Maskapai</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{detail.airlineCode || '-'}</p>
          </div>
          <div>
            <p className="text-[.64rem] uppercase tracking-wider text-[var(--text-tertiary)]">Total</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{fmtRupiah(detail.grandTotal)}</p>
          </div>
          <div>
            <p className="text-[.64rem] uppercase tracking-wider text-[var(--text-tertiary)]">Dibuat</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{fmtDateTime(detail.createdAt)}</p>
          </div>
          <div>
            <p className="text-[.64rem] uppercase tracking-wider text-[var(--text-tertiary)]">Kadaluarsa</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{fmtDateTime(detail.expiresAt)}</p>
          </div>
          {detail.note && (
            <div className="col-span-2">
              <p className="text-[.64rem] uppercase tracking-wider text-[var(--text-tertiary)]">Catatan</p>
              <p className="mt-1 text-[var(--text-secondary)]">{detail.note}</p>
            </div>
          )}
        </div>

        {detailFlights.length > 0 && (
          <div>
            <p className="text-[.7rem] font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
              Penerbangan ({detailFlights.length})
            </p>
            {renderFlightTable(detailFlights)}
          </div>
        )}

        {detail.proofFileUrl && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] p-3">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Upload size={16} />
              Bukti pembayaran terlampir
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(detail.proofFileUrl, '_blank', 'noopener,noreferrer')}
            >
              Lihat Bukti
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <CardHeader
        title="Tagihan Batch"
        subtitle="Buat dan kelola tagihan batch untuk operator / maskapai"
        icon={<Layers size={16} />}
      />

      <div className="flex gap-1 rounded-xl border border-[var(--border-subtle)] p-1 bg-[var(--bg-card)] w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
              tab === t.key
                ? 'bg-brand-600 text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--table-hover)] hover:text-[var(--text-primary)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'create' && (
        <Card>
          <CardHeader
            title="Pilih Unit"
            subtitle="Menampilkan flight yang siap ditagih dari unit terpilih"
            actions={
              <Select
                value={activeUnit}
                onChange={(e) => setActiveUnit(e.target.value)}
                className="w-40"
              >
                <option value="">Pilih Unit</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            }
          />
          <div className="p-5">
            {!currentUnit ? (
              <EmptyState title="Pilih unit dulu" subtitle="Pilih unit untuk melihat daftar flight yang dapat di-batch." />
            ) : flightsLoading ? (
              <TableSkeleton columns={6} />
            ) : billable.length === 0 ? (
              <EmptyState
                title="Tidak ada flight untuk di-batch"
                subtitle="Tidak ada flight berstatus INVOICED / UNPAID pada unit ini."
                onRefresh={() => refetchUnit()}
              />
            ) : (
              <>
                {renderFlightTable(billable, { checkbox: true })}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-[var(--text-secondary)]">
                    <span className="font-bold text-[var(--text-primary)]">{selectedIds.length}</span> flight
                    terpilih · Total{' '}
                    <span className="font-bold text-[var(--text-primary)]">{fmtRupiah(selectedTotal)}</span>
                  </div>
                  <Button
                    variant="primary"
                    disabled={selectedIds.length === 0}
                    loading={generate.isPending}
                    onClick={() => generate.mutate(selectedIds)}
                  >
                    <Link2 size={16} /> Buat Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardHeader
            title="Riwayat Batch"
            subtitle={isAdmin ? 'Semua batch seluruh unit' : `Batch yang dibuat (${authUnit || '-'})`}
          />
          <div className="p-5">
            {historyLoading ? (
              <TableSkeleton columns={4} />
            ) : batches.length === 0 ? (
              <EmptyState
                title="Belum ada batch"
                subtitle="Batch yang dibuat akan muncul di sini."
                onRefresh={() => refetchHistory()}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {batches.map((b) => {
                  const status = b.status;
                  const canModerate = isAdmin && [BATCH_STATUS.SENT, BATCH_STATUS.PROOF_SUBMITTED].includes(status);
                  return (
                    <Card
                      key={b.batchId || b.id}
                      className="p-4"
                      onClick={() => setDetailTarget(b)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge status={status} label={batchStatusLabel(status)} />
                        <span className="text-[.68rem] text-[var(--text-tertiary)]">{fmtDateTime(b.createdAt)}</span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-tertiary)]">Total</span>
                          <span className="font-bold text-[var(--text-primary)]">{fmtRupiah(b.grandTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-tertiary)]">Flight</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {Array.isArray(b.rowIds) ? b.rowIds.length : (b.flightCount || '-')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-tertiary)]">Operator</span>
                          <span className="font-semibold text-[var(--text-primary)]">{b.operatorName || b.createdBy || '-'}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {canModerate && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              disabled={verify.isPending && verifyTarget === b.batchId}
                              onClick={() => setVerifyTarget(b)}
                            >
                              <CheckCircle2 size={14} /> Verifikasi
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setRejectTarget(b);
                                setRejectReason('');
                              }}
                            >
                              <XCircle size={14} /> Tolak
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => copyUrl(buildBatchUrl(b.batchId, b.token))}>
                          <Copy size={14} /> Salin Link
                        </Button>
                        {b.token && (
                          <Button variant="outline" size="sm" onClick={() => openPortal(b)}>
                            <ExternalLink size={14} /> Buka Portal
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      <Modal
        open={!!successModal}
        onClose={() => setSuccessModal(null)}
        title="Link Batch Berhasil Dibuat"
        maxWidth="640px"
      >
        {successModal && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              URL ini dikirim ke operator / maskapai. Salin link berikut:
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
              <input
                readOnly
                value={successModal.url}
                className="flex-1 min-w-0 bg-transparent text-xs text-[var(--text-secondary)] outline-none"
                onFocus={(e) => e.target.select()}
              />
              <Button variant="primary" size="sm" onClick={() => copyUrl(successModal.url)}>
                <Copy size={14} /> Salin
              </Button>
            </div>

            <div>
              <p className="text-[.7rem] font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                Ringkasan ({successModal.rowIds?.length || selectedIds.length} flight)
              </p>
              {renderFlightTable(
                billable.filter((f) =>
                  (successModal.rowIds || selectedIds).includes(f.rid)
                )
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] p-3">
              <span className="text-sm text-[var(--text-secondary)]">Grand Total</span>
              <span className="text-base font-bold text-[var(--text-primary)]">
                {fmtRupiah(successModal.grandTotal ?? selectedTotal)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        title="Konfirmasi Verifikasi"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin memverifikasi batch ini? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setVerifyTarget(null)}>Batal</Button>
          <Button
            variant="success"
            loading={verify.isPending}
            onClick={() => verifyTarget && verify.mutate(verifyTarget.batchId)}
          >
            <CheckCircle2 size={16} /> Verifikasi
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Tolak Batch"
      >
        <TextArea
          label="Alasan Penolakan"
          placeholder="Tuliskan alasan penolakan (minimal 5 karakter)..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          error={rejectReason && rejectReason.trim().length < 5 ? 'Alasan minimal 5 karakter' : undefined}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejectTarget(null)}>Batal</Button>
          <Button
            variant="danger"
            loading={reject.isPending}
            disabled={rejectReason.trim().length < 5}
            onClick={() => rejectTarget && reject.mutate({ batchId: rejectTarget.batchId, reason: rejectReason.trim() })}
          >
            <XCircle size={16} /> Tolak
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Detail Batch"
        maxWidth="720px"
      >
        {renderDetail()}
      </Modal>
    </div>
  );
}
