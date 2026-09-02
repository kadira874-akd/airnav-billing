import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, RefreshCcw, FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Input, Select, TextArea, Checkbox } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/stores';
import TableSkeleton from '../components/ui/TableSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { useMasterList, useMasterMutations } from '../hooks/useQueries';
import { useConfig } from '../hooks/useQueries';
import { fmtDateTime, fmtNumber } from '../lib/format';
import { UNITS } from '../config';

const CATEGORIES = [
  { key: 'Master_Airline', label: 'Master Airline' },
  { key: 'Master_Rate', label: 'Master Rate' },
  { key: 'Master_AirportHours', label: 'Jam Operasional Bandara' },
  { key: 'Master_Signatory', label: 'Penandatangan' },
  { key: 'Master_BankAccount', label: 'Bank Account' },
  { key: 'Master_User', label: 'User' },
  { key: 'Master_Config', label: 'Konfigurasi' },
  { key: 'Master_ExchangeRate', label: 'Kurs' },
];

const UNIT_OPTIONS = UNITS.map((u) => ({ label: u.code, value: u.code }));

const FieldMapping = {
  Master_Airline: [
    { key: 'airlineCode', label: 'Kode Airline', type: 'text', required: true },
    { key: 'operator', label: 'Operator', type: 'text', required: true },
    { key: 'airlineName', label: 'Nama Airline', type: 'text', required: true },
    { key: 'waNumber', label: 'No. WhatsApp', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
  ],
  Master_Rate: [
    { key: 'unitCode', label: 'Unit', type: 'select', options: UNIT_OPTIONS, required: true },
    { key: 'service', label: 'Service', type: 'select', options: [{ label: 'EXTEND', value: 'EXTEND' }, { label: 'ADVANCE', value: 'ADVANCE' }], required: true },
    { key: 'domInt', label: 'Dom/Int', type: 'select', options: [{ label: 'DOMESTIK', value: 'DOMESTIK' }, { label: 'INTERNATIONAL', value: 'INTERNATIONAL' }], required: true },
    { key: 'rateIDR', label: 'Rate IDR', type: 'number', required: true },
    { key: 'rateUSD', label: 'Rate USD', type: 'number', required: true },
  ],
  Master_AirportHours: [
    { key: 'airportCode', label: 'Kode Bandara', type: 'text', required: true },
    { key: 'airportName', label: 'Nama Bandara', type: 'text', required: true },
    { key: 'normalStart', label: 'Jam Mulai', type: 'time', required: true },
    { key: 'normalEnd', label: 'Jam Selesai', type: 'time', required: true },
    { key: 'roundingMethod', label: 'Pembulatan', type: 'select', options: [{ label: 'CEIL', value: 'CEIL' }, { label: 'FLOOR', value: 'FLOOR' }, { label: 'ROUND', value: 'ROUND' }], required: true },
    { key: 'minDuration', label: 'Durasi Min (menit)', type: 'number', required: true },
    { key: 'isActive', label: 'Aktif', type: 'checkbox' },
  ],
  Master_Signatory: [
    { key: 'unitCode', label: 'Unit', type: 'select', options: [{ label: 'ALL', value: 'ALL' }, ...UNIT_OPTIONS], required: true },
    { key: 'name', label: 'Nama', type: 'text', required: true },
    { key: 'position', label: 'Jabatan', type: 'text', required: true },
    { key: 'nip', label: 'NIP', type: 'text', required: true },
    { key: 'isActive', label: 'Aktif', type: 'checkbox' },
  ],
  Master_BankAccount: [
    { key: 'unitCode', label: 'Unit', type: 'text', required: true },
    { key: 'bankName', label: 'Nama Bank', type: 'text', required: true },
    { key: 'branch', label: 'Cabang', type: 'text' },
    { key: 'accountName', label: 'Nama Rekening', type: 'text', required: true },
    { key: 'accountNumber', label: 'Nomor Rekening', type: 'text', required: true },
    { key: 'swiftCode', label: 'SWIFT Code', type: 'text' },
    { key: 'isDefault', label: 'Default', type: 'checkbox' },
  ],
  Master_User: [
    { key: 'username', label: 'Username', type: 'text', required: true },
    { key: 'passwordHash', label: 'Password', type: 'password', required: true },
    { key: 'fullName', label: 'Nama Lengkap', type: 'text', required: true },
    { key: 'unitCode', label: 'Unit', type: 'select', options: [{ label: 'ALL', value: 'ALL' }, ...UNIT_OPTIONS], required: true },
    { key: 'isActive', label: 'Aktif', type: 'checkbox' },
  ],
  Master_Config: [
    { key: 'configKey', label: 'Key', type: 'text', required: true },
    { key: 'configValue', label: 'Value', type: 'text', required: true },
    { key: 'description', label: 'Deskripsi', type: 'textarea' },
  ],
  Master_ExchangeRate: [
    { key: 'currency', label: 'Mata Uang', type: 'text', required: true },
    { key: 'rate', label: 'Rate', type: 'number', required: true },
    { key: 'source', label: 'Sumber', type: 'text' },
  ],
};

const SKIP_COLUMNS = { isDeleted: true, createdAt: true, updatedAt: true, updatedBy: true, qrcodeUrl: true, qrcodeText: true, qrcodeBase64: true };

function getDisplayColumns(sheet) {
  const fields = FieldMapping[sheet] || [];
  const keys = fields.map((f) => f.key);
  return keys.filter((k) => !SKIP_COLUMNS[k]);
}

function buildEmptyForm(sheet) {
  const fields = FieldMapping[sheet] || [];
  const form = {};
  fields.forEach((f) => {
    if (f.type === 'checkbox') form[f.key] = false;
    else if (f.type === 'number') form[f.key] = '';
    else form[f.key] = '';
  });
  return form;
}

function buildEditForm(sheet, row) {
  const fields = FieldMapping[sheet] || [];
  const form = {};
  fields.forEach((f) => {
    if (f.key === 'passwordHash') { form[f.key] = ''; return; }
    form[f.key] = row[f.key] ?? '';
  });
  return form;
}

export default function MasterPage() {
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const [activeSheet, setActiveSheet] = useState(() => localStorage.getItem('master_active_sheet') || 'Master_Airline');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: masterData, isLoading } = useMasterList(activeSheet);
  const { data: configData } = useConfig();
  const { save, remove } = useMasterMutations();

  const records = useMemo(() => {
    let rows = masterData?.data || [];
    if (activeSheet === 'Master_Airline' || activeSheet === 'Master_Rate' || activeSheet === 'Master_BankAccount') {
      rows = rows.filter((r) => !r.isDeleted);
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
        return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }
    return rows;
  }, [masterData, sortKey, sortDir, activeSheet]);

  const displayCols = useMemo(() => getDisplayColumns(activeSheet), [activeSheet]);

  const categoryLabel = useMemo(() => CATEGORIES.find((c) => c.key === activeSheet)?.label || activeSheet, [activeSheet]);

  const handleSwitchCategory = useCallback((key) => {
    setActiveSheet(key);
    setSortKey(null);
    setSortDir('asc');
    localStorage.setItem('master_active_sheet', key);
  }, []);

  const handleSort = useCallback((col) => {
    setSortKey((prev) => {
      if (prev === col) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); return col; }
      setSortDir('asc');
      return col;
    });
  }, []);

  const handleAdd = useCallback(() => {
    setEditingRow(null);
    setFormData(buildEmptyForm(activeSheet));
    setModalOpen(true);
  }, [activeSheet]);

  const handleEdit = useCallback((row) => {
    setEditingRow(row);
    setFormData(buildEditForm(activeSheet, row));
    setModalOpen(true);
  }, [activeSheet]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    remove.mutate({ sheet: activeSheet, rid: deleteTarget.rid }, {
      onSuccess: () => { addToast('Data berhasil dihapus', 'success'); setDeleteTarget(null); },
      onError: (e) => { addToast(e.message || 'Gagal menghapus', 'error'); setDeleteTarget(null); },
    });
  }, [deleteTarget, activeSheet, remove, addToast]);

  const handleSave = useCallback(() => {
    const fields = FieldMapping[activeSheet] || [];
    const payload = { ...formData };

    fields.forEach((f) => {
      if (f.type === 'number' && payload[f.key] !== '') payload[f.key] = Number(payload[f.key]);
      if (f.type === 'checkbox') payload[f.key] = !!payload[f.key];
    });

    if (editingRow && activeSheet === 'Master_User' && !payload.passwordHash) {
      delete payload.passwordHash;
    }

    const rid = editingRow?.rid || null;

    save.mutate({ sheet: activeSheet, data: payload, rid }, {
      onSuccess: () => {
        addToast(editingRow ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan', 'success');
        setModalOpen(false);
        setEditingRow(null);
      },
      onError: (e) => addToast(e.message || 'Gagal menyimpan', 'error'),
    });
  }, [formData, editingRow, activeSheet, save, addToast]);

  const isConfigSheet = activeSheet === 'Master_Config';

  return (
    <div className="flex gap-4 h-full min-h-0">
      <div className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleSwitchCategory(cat.key)}
            className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSheet === cat.key
                ? 'bg-[var(--border-strong)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--table-hover)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <Card className="flex-1 min-w-0 flex flex-col min-h-0">
        <CardHeader className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{categoryLabel}</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--border-mid)] text-[var(--text-secondary)]">
              {records.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleSwitchCategory(activeSheet)}>
              <RefreshCcw size={14} />
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus size={14} className="mr-1" /> Tambah
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={displayCols.length} />
          ) : records.length === 0 ? (
            <EmptyState message={`Belum ada data ${categoryLabel}`} />
          ) : isConfigSheet ? (
            <div className="p-4 flex flex-col gap-3">
              {records.map((row, i) => (
                <div key={row.rid || i} className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-start gap-3">
                  <FileText size={18} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--text-primary)] font-mono">{row.configKey}</span>
                      <span className="text-sm text-[var(--text-secondary)] break-all">{row.configValue}</span>
                    </div>
                    {row.description && <p className="text-xs text-[var(--text-tertiary)] mt-1">{row.description}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Pencil size={14} /></Button>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--bg-surface)]">
                <tr>
                  {displayCols.map((col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] cursor-pointer select-none hover:text-[var(--text-primary)] border-b border-[var(--border-subtle)]"
                    >
                      {col}
                      {sortKey === col && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((row, idx) => (
                  <tr key={row.rid || idx} className="hover:bg-[var(--table-hover)] transition-colors">
                    {displayCols.map((col) => (
                      <td
                        key={col}
                        className={`px-3 py-2 border-b border-[var(--border-subtle)] text-[var(--text-primary)] ${
                          ['rateIDR', 'rateUSD', 'rate', 'accountNumber', 'airportCode', 'airlineCode', 'unitCode', 'username', 'configKey', 'nip'].includes(col)
                            ? 'font-mono text-xs'
                            : ''
                        }`}
                      >
                        {typeof row[col] === 'boolean' ? (
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${row[col] ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-500'}`}>
                            {row[col] ? 'Ya' : 'Tidak'}
                          </span>
                        ) : typeof row[col] === 'number' ? (
                          <span className="font-mono text-xs">{fmtNumber(row[col])}</span>
                        ) : (
                          <span className="text-sm truncate block max-w-[200px]">{row[col] ?? '-'}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-b border-[var(--border-subtle)] text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="inline-flex"><Pencil size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)} className="inline-flex ml-1"><Trash2 size={14} className="text-red-400" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRow(null); }}
        title={editingRow ? `Edit ${categoryLabel}` : `Tambah ${categoryLabel}`}
        size="md"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="flex flex-col gap-4"
        >
          {(FieldMapping[activeSheet] || []).map((field) => {
            const isEditPasswordField = activeSheet === 'Master_User' && field.key === 'passwordHash' && editingRow;
            const label = isEditPasswordField ? 'Password (kosong = tidak berubah)' : field.label;

            if (field.type === 'checkbox') {
              return (
                <Checkbox
                  key={field.key}
                  label={label}
                  checked={!!formData[field.key]}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.checked }))}
                />
              );
            }

            if (field.type === 'select') {
              return (
                <Select
                  key={field.key}
                  label={label}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                  options={field.options}
                  required={field.required}
                />
              );
            }

            if (field.type === 'textarea') {
              return (
                <TextArea
                  key={field.key}
                  label={label}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                  rows={3}
                />
              );
            }

            if (field.type === 'time') {
              return (
                <Input
                  key={field.key}
                  type="time"
                  label={label}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                  required={field.required}
                />
              );
            }

            return (
              <Input
                key={field.key}
                type={field.type}
                label={label}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                required={isEditPasswordField ? false : field.required}
              />
            );
          })}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingRow(null); }}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={save.isPending} disabled={save.isPending}>
              {editingRow ? 'Simpan Perubahan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
          <Button variant="danger" loading={remove.isPending} disabled={remove.isPending} onClick={handleConfirmDelete}>
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  );
}
