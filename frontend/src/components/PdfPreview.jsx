// ============================================================
// PDF PREVIEW — modal preview dokumen (invoice / kwitansi)
// dalam iframe + tombol download PDF.
// ============================================================
import { useEffect, useState, useRef } from 'react';
import { FileDown, FileText, Receipt } from 'lucide-react';
import api from '../lib/apiClient';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function PdfPreview({ flight, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('invoice');
  const [downloading, setDownloading] = useState(false);
  const [builder, setBuilder] = useState(null);
  const fetchId = useRef(0);

  useEffect(() => {
    if (!open || !flight) return;
    const id = ++fetchId.current;
    const unitCode = flight.unitCode || '';

    setLoading(true);
    setError('');
    setData(null);
    setTab('invoice');

    // import() dinamis: bundle jspdf+html2canvas (~600KB) hanya dimuat
    // saat preview benar-benar dibuka → initial load app tetap ringan.
    import('../lib/pdfBuilder')
      .then((m) => {
        if (id !== fetchId.current) return;
        setBuilder(m);
      })
      .catch(() => {});

    Promise.allSettled([
      api.bankAccounts(unitCode),
      api.config(),
      api.signatory(unitCode),
      api.masterList('Master_Airline'),
      api.masterList('Master_AirportHours'),
      api.masterList('Master_ExchangeRate'),
    ]).then(([bankRes, cfgRes, signRes, airlineRes, aptRes, exRateRes]) => {
      if (id !== fetchId.current) return;
      setData({ bankRes, cfgRes, signRes, airlineRes, aptRes, exRateRes });
      setLoading(false);
    });
  }, [open, flight]);

  const previewData = data || null;

  const invoiceHTML =
    previewData && builder ? builder.buildInvoiceHTML(flight, previewData) : '';
  const kwitansiHTML =
    previewData && builder && flight?.statusFlow === 'PAID'
      ? builder.buildKwitansiHTML(flight, previewData)
      : '';

  const isPaid = flight?.statusFlow === 'PAID';
  const activeHTML = tab === 'invoice' ? invoiceHTML : kwitansiHTML;

  async function handleDownload() {
    if (!previewData) return;
    setDownloading(true);
    try {
      const mod = builder || (await import('../lib/pdfBuilder'));
      await mod.downloadCombinedPdf(flight, previewData);
    } catch (e) {
      setError('Gagal membuat PDF: ' + (e?.message || e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Preview Dokumen"
      maxWidth="860px"
    >
      <div className="flex flex-col h-[85vh]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-2">
            {isPaid ? (
              <>
                <button
                  onClick={() => setTab('invoice')}
                  className={
                    'inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ' +
                    (tab === 'invoice'
                      ? 'bg-brand-600 text-white'
                      : 'bg-[var(--table-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
                  }
                >
                  <FileText size={14} />
                  Invoice
                </button>
                <button
                  onClick={() => setTab('kwitansi')}
                  className={
                    'inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ' +
                    (tab === 'kwitansi'
                      ? 'bg-brand-600 text-white'
                      : 'bg-[var(--table-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
                  }
                >
                  <Receipt size={14} />
                  Kwitansi
                </button>
              </>
            ) : (
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                Invoice
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {error && <span className="text-xs font-semibold text-rose-600">{error}</span>}
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
            <Button
              variant="primary"
              onClick={handleDownload}
              loading={downloading}
              disabled={!previewData || loading}
            >
              <FileDown size={15} />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-[#CBD5E1] p-5">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <span className="inline-block w-8 h-8 border-2 border-brand-600/20 border-t-brand-600 rounded-full animate-spin" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Memuat data pendukung…
                </span>
              </div>
            </div>
          ) : !previewData ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <FileText size={32} className="text-[var(--text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Data pendukung belum tersedia.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-start justify-center">
              <iframe
                key={tab}
                title={tab === 'invoice' ? 'Preview Invoice' : 'Preview Kwitansi'}
                srcDoc={activeHTML}
                sandbox="allow-same-origin allow-scripts"
                className="h-full min-h-[700px] w-[210mm] shrink-0 rounded-lg bg-white shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}