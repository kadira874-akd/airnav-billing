import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  Plane,
  ReceiptText,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import api from '../lib/apiClient';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { fmtRupiah, fmtDate, fmtDateTime, batchStatusLabel } from '../lib/format';

function InfoItem({ label, value, mono }) {
  return (
    <div>
      <p className="text-[.68rem] uppercase tracking-wide text-[var(--text-tertiary)]">
        {label}
      </p>
      <p
        className={
          'text-sm font-bold text-[var(--text-primary)] mt-1' +
          (mono ? ' font-mono' : '')
        }
      >
        {value || '—'}
      </p>
    </div>
  );
}

function StatusSection({ batch }) {
  const status = batch.status;

  if (status === 'ACTIVE' || status === 'SENT') {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-3">
        <Clock className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-300">
            Menunggu bukti pembayaran
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Silakan kirim bukti pembayaran kepada administrasi AirNav Indonesia
            untuk diproses dan diverifikasi.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'PROOF_SUBMITTED') {
    return (
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-5 flex items-start gap-3">
        <Clock className="text-sky-500 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-bold text-sky-600 dark:text-sky-300">
            Bukti pembayaran sudah dikirim. Menunggu verifikasi.
          </p>
          {batch.proofNote && (
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Catatan: {batch.proofNote}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === 'VERIFIED') {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-3">
        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
        <div>
          <Badge status="VERIFIED" label="Lunas — Terverifikasi" className="mb-2" />
          <p className="text-sm text-[var(--text-tertiary)]">
            Tagihan ini telah diverifikasi pada {fmtDate(batch.verifiedAt)}.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'REJECTED' || status === 'REJECTED_FINAL') {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="text-rose-500 shrink-0" size={20} />
          <Badge
            status="REJECTED"
            label={status === 'REJECTED_FINAL' ? 'Ditolak Final' : 'Bukti Ditolak'}
          />
        </div>
        <p className="text-sm text-[var(--text-tertiary)]">
          Alasan:{' '}
          <span className="font-semibold text-rose-600 dark:text-rose-300">
            {batch.rejectReason || 'Tidak dicantumkan'}
          </span>
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Silakan hubungi administrasi AirNav Indonesia untuk mengunggah ulang
          bukti pembayaran.
        </p>
      </div>
    );
  }

  return null;
}

export default function PublicBatchPage() {
  const { bid, token } = useParams();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['publicBatch', bid, token],
    queryFn: () => api.publicBatchData(bid, token),
    enabled: !!bid && !!token,
  });

  const batch = data?.data;

  const {
    data: flightsData,
    isLoading: flightsLoading,
    isError: flightsError,
  } = useQuery({
    queryKey: ['batchFlights', batch?.rowIds?.join(',')],
    queryFn: () => api.flightsByRowIds(batch.rowIds),
    enabled: !!batch?.rowIds?.length,
  });

  const flights = flightsData?.data || [];

  return (
    <div
      className="h-dvh overflow-y-auto"
      style={{ background: 'var(--gradient-mesh)' }}
    >
      <div className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 bg-[var(--bg-card)]/90 backdrop-blur border-b border-[var(--border-subtle)]">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/40">
              <Plane size={22} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[var(--text-primary)] leading-tight">
                AirNav Indonesia
              </h1>
              <p className="text-xs text-[var(--text-tertiary)]">
                Portal Tagihan — Operator / Maskapai
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="animate-spin text-brand-600" size={40} />
              <p className="mt-3 text-sm text-[var(--text-tertiary)]">
                Memuat data tagihan…
              </p>
            </div>
          ) : isError || !batch ? (
            <Card className="p-10 flex flex-col items-center text-center">
              <AlertTriangle className="text-rose-500" size={36} />
              <h2 className="mt-3 text-base font-bold text-[var(--text-primary)]">
                Link tidak valid atau tagihan tidak ditemukan
              </h2>
              <p className="mt-1 text-sm text-[var(--text-tertiary)] max-w-md">
                {error?.message ||
                  'Periksa kembali tautan yang Anda terima dari AirNav Indonesia.'}
              </p>
              <Button
                className="mt-5"
                variant="primary"
                onClick={() => refetch()}
              >
                Coba Lagi
              </Button>
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge
                    status={batch.status}
                    label={batchStatusLabel(batch.status)}
                  />
                  <span className="text-xs font-mono text-[var(--text-tertiary)]">
                    Batch: {batch.batchId}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoItem label="Operator" value={batch.operatorName} />
                  <InfoItem label="Maskapai" value={batch.airlineCode} />
                  <InfoItem
                    label="Tanggal Dibuat"
                    value={fmtDateTime(batch.createdAt)}
                  />
                  <InfoItem
                    label="Berlaku Hingga"
                    value={fmtDate(batch.expiresAt)}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-end justify-between gap-3 flex-wrap">
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    Grand Total
                  </span>
                  <span className="text-2xl font-extrabold text-brand-600">
                    {fmtRupiah(batch.grandTotal)}
                  </span>
                </div>
              </Card>

              <Card className="mt-4 overflow-hidden">
                <CardHeader
                  title="Rincian Penerbangan"
                  subtitle={`${flights.length} penerbangan`}
                  icon={<ReceiptText size={16} />}
                />
                {flightsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-[var(--text-tertiary)]" size={28} />
                  </div>
                ) : flightsError ? (
                  <p className="px-5 py-8 text-sm text-rose-500">
                    Gagal memuat rincian penerbangan.
                  </p>
                ) : flights.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-[var(--text-tertiary)]">
                    Tidak ada data penerbangan.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[760px]">
                      <thead>
                        <tr className="text-left text-[.68rem] uppercase tracking-wide text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] bg-[var(--table-stripe)]">
                          <th className="px-4 py-2.5 font-semibold">Tanggal</th>
                          <th className="px-4 py-2.5 font-semibold">ACID</th>
                          <th className="px-4 py-2.5 font-semibold">Registrasi</th>
                          <th className="px-4 py-2.5 font-semibold">Kategori</th>
                          <th className="px-4 py-2.5 font-semibold">Dom/Int</th>
                          <th className="px-4 py-2.5 font-semibold">Durasi</th>
                          <th className="px-4 py-2.5 font-semibold">Invoice No</th>
                          <th className="px-4 py-2.5 font-semibold text-right">
                            Total Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {flights.map((f) => (
                          <tr
                            key={f.rowId}
                            className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--table-hover)]"
                          >
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {fmtDate(f.flightDate)}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold">
                              {f.acid}
                            </td>
                            <td className="px-4 py-2.5 font-mono">
                              {f.registration}
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge
                                status={f.category}
                                label={
                                  f.category === 'EXTEND'
                                    ? 'Extend'
                                    : f.category === 'ADVANCE'
                                      ? 'Advance'
                                      : f.category
                                }
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge
                                status={f.domInt}
                                label={
                                  f.domInt === 'DOMESTIK'
                                    ? 'Domestik'
                                    : f.domInt === 'INTERNATIONAL'
                                      ? 'Internasional'
                                      : f.domInt
                                }
                              />
                            </td>
                            <td className="px-4 py-2.5">{f.duration}</td>
                            <td className="px-4 py-2.5 font-mono">
                              {f.invoiceNo || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold whitespace-nowrap">
                              {fmtRupiah(f.totalAmount ?? f.grandAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <div className="mt-4">
                <StatusSection batch={batch} />
              </div>
            </>
          )}
        </main>

        <footer className="py-5 text-center text-xs text-[var(--text-tertiary)]">
          © {new Date().getFullYear()} AirNav Indonesia. Hak cipta dilindungi.
        </footer>
      </div>
    </div>
  );
}