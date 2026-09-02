import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plane, Download, Loader2, AlertTriangle, FileText, ReceiptText } from 'lucide-react';
import api from '../lib/apiClient';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { fmtRupiah, fmtDate, statusLabel } from '../lib/format';

export default function PublicDocPage() {
  const { rid, t } = useParams();
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['publicDoc', rid, t],
    queryFn: () => api.publicDocData(rid, t),
    enabled: !!rid && !!t,
  });

  const rec = data?.data;
  const isPaid = rec && String(rec.statusFlow || rec.status || '').toUpperCase() === 'PAID';
  const route =
    rec?.adep && rec?.ades ? `${rec.adep} → ${rec.ades}` : rec?.dep_arr_loc || '—';

  const previewData = useMemo(() => {
    if (!rec) return null;
    return {
      signRes: {
        data: {
          ...(rec.signatorySnapshot || {}),
          name: rec.signName,
          position: rec.signPosition,
          nip: rec.signNip,
        },
      },
      bankRes: null,
      cfgRes: null,
      airlineRes: null,
      aptRes: null,
      exRateRes: null,
    };
  }, [rec]);

  const handleDownload = async () => {
    if (!rec) return;
    setDownloading(true);
    try {
      const { downloadCombinedPdf } = await import('../lib/pdfBuilder');
      await downloadCombinedPdf(rec, previewData);
    } catch (err) {
      console.log('PDF download not implemented yet');
      toast.info('Fitur download PDF sedang dalam pengembangan');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="h-dvh overflow-y-auto flex items-center justify-center p-4"
      style={{ background: '#0a1929' }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/40 mb-4">
            <Plane size={28} />
          </div>
          <h1 className="text-xl font-extrabold text-white">AirNav Indonesia</h1>
          <p className="text-sm text-slate-400 mt-1">Download Dokumen Publik</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-[#0f2239] border border-white/10 p-10 flex flex-col items-center">
            <Loader2 className="animate-spin text-brand-400" size={36} />
            <p className="mt-4 text-sm text-slate-400">Memuat dokumen…</p>
          </div>
        ) : isError || !rec ? (
          <div className="rounded-xl bg-[#0f2239] border border-white/10 p-8 flex flex-col items-center text-center">
            <AlertTriangle className="text-rose-400" size={36} />
            <h2 className="mt-3 text-base font-bold text-white">
              Dokumen tidak dapat diakses
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {error?.message ||
                'Link tidak valid, sudah kedaluwarsa, atau dokumen tidak ditemukan.'}
            </p>
            <Button className="mt-5" variant="primary" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <div className="rounded-xl bg-[#0f2239] border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
              <FileText size={16} className="text-brand-400 shrink-0" />
              <span className="text-sm font-bold text-white truncate">
                {rec.invoiceNo}
              </span>
              <div className="ml-auto shrink-0">
                <Badge status={rec.statusFlow} label={statusLabel(rec.statusFlow)} />
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              <InfoRow label="Nomor Invoice" value={rec.invoiceNo} mono />
              <InfoRow label="ACID / Registrasi" value={`${rec.acid} · ${rec.registration}`} mono />
              <InfoRow label="Tanggal Terbang" value={fmtDate(rec.flightDate)} />
              <InfoRow label="Rute" value={route} mono />
              <InfoRow label="Dom / Int" value={statusLabel(rec.domInt)} />
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Total Tagihan
                </span>
                <span className="text-xl font-extrabold text-white">
                  {fmtRupiah(rec.totalAmount ?? rec.grossAmount)}
                </span>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/10 space-y-2">
              <Button
                variant="primary"
                className="w-full"
                loading={downloading}
                onClick={handleDownload}
              >
                <Download size={16} />
                Download Invoice PDF
              </Button>
              {isPaid && (
                <Button
                  variant="success"
                  className="w-full"
                  loading={downloading}
                  onClick={handleDownload}
                >
                  <ReceiptText size={16} />
                  Download Invoice & Kwitansi PDF
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-500 mt-5">
          © {new Date().getFullYear()} AirNav Indonesia
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <span
        className={
          'text-sm font-bold text-white text-right break-all' + (mono ? ' font-mono' : '')
        }
      >
        {value || '—'}
      </span>
    </div>
  );
}