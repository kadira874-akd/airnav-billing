# AirNav Billing — React + Apps Script

Frontend modern (React 19 + Vite + Tailwind v4) dengan backend tetap Google Apps Script + Spreadsheet/Drive. Render cepat berkat SPA code-splitting + TanStack Query cache, tampilan profesional dengan dark/light theme.

## Struktur

```
Airnav-Billing/
├── backend/                  # Tambahkan ke project Apps Script yang sudah live
│   ├── API.gs                # JSON REST bridge (doGet/doPost) -> panggil fungsi code.gs existing
│   └── appsscript.json       # manifest web app (Anyone, USER_DEPLOYING)
└── frontend/                 # React SPA
    └── src/
        ├── config.js         # URL Apps Script, daftar unit, konstanta
        ├── lib/
        │   ├── apiClient.js  # fetch wrapper -> semua endpoint API
        │   ├── format.js     # format Rupiah, tanggal/waktu, status
        │   └── pdfBuilder.js # PDF invoice & kwitansi A4 (html2canvas + jsPDF)
        ├── store/stores.js   # auth + UI state (zustand, persisted)
        ├── hooks/            # React Query hooks + jam WITA/UTC
        ├── components/
        │   ├── ui/           # Button, Card, Modal, Badge, Input, Toast, Skeleton, EmptyState
        │   ├── PdfPreview.jsx # modal preview + download PDF (lazy-load builder)
        │   └── layout/       # AppShell (sidebar + topbar + clock)
        └── pages/            # Login, Dashboard, Flights, Batch, Master, Settings
                              # + PublicBatch (portal tagihan), PublicDoc (download publik)
```

## Cara Pasang Backend (Apps Script)

1. Buka project Apps Script Anda saat ini di script.google.com.
2. **Tambah file `backend/API.gs`** ke project.
3. **Hapus fungsi `doGet()`** lama dari `code.gs` (yang hanya serve HTML).
   Semua fungsi lain TIDAK perlu diubah.
4. Deploy -> Web App -> Execute as: **Me**, Who has access: **Anyone**.
5. Salin URL `/exec`, isi ke `frontend/src/config.js` (atau env `VITE_APPSCRIPT_URL`).

Semua request dari React lewat `?action=...` (GET) atau JSON body `{action, ...}` (POST),
memanggil nama fungsi yang sama dengan yang sudah ada di `code.gs` (login, dashboard,
unitData, validateFlight, generateBatch, verifyBatch, submitBatchProof, dsb).

## Menjalankan Frontend

```bash
cd frontend
npm install
npm run dev     # dev server + proxy /api -> Apps Script (bebas CORS)
```

### Koneksi ke Backend

- **Dev**: `APPSCRIPT_URL = '/api'` -> diproxy Vite ke Apps Script (hindari CORS di browser). Target proxy diatur di `vite.config.js`.
- **Prod**: set `VITE_APPSCRIPT_URL` ke URL web app `/exec`, lalu `npm run build`.

## Deploy Frontend

```bash
cd frontend
npm run build
# hasil: frontend/dist — deploy ke Vercel / Netlify / hosting statis apa pun
# vercel.json sudah termasuk SPA rewrite & security headers
```

## Halaman

| Route               | Fungsi |
|---------------------|--------|
| `/login`            | Login, pesan lockout, force login saat sesi konflik |
| `/`                 | Dashboard: KPI cards, realisasi nominal/revenue, distribusi kategori, kinerja per unit, flight terbaru |
| `/flights`          | Data penerbangan: CRUD, validasi invoice (PPN/PPh/kurs), status flow, void, search & sort |
| `/batch`            | Tagihan batch: pilih multi-flight, buat link tagihan, verifikasi/tolak bukti, riwayat |
| `/master`           | Master data: airline, rate, jam bandara, penandatangan, bank, user, config, kurs |
| `/settings`         | Profil, ganti password, preferensi tema, info aplikasi |
| `/b/:bid/:token`    | Portal tagihan publik (tanpa login) — lihat status & detail batch |
| `/d/:rid/:token`    | Download dokumen publik (tanpa login) — invoice & kwitansi PDF |

## Fitur PDF

- **Preview & Download** di halaman `Flights` (tombol download di baris INVOICED/UNPAID/PAID).
- Fidelity tinggi: CSS & markup invoice/kwitansi A4 port persis dari sistem lama
  (lihat `DocBuilderShared.html` & `buildDocHTML` di `index.html` asli).
- PDF dibangun di client dengan `html2canvas` + `jsPDF`, QR signatory dari `signatorySnapshot`.
- Bundle PDF (~600KB) **lazy-loaded** — hanya dimuat saat preview dibuka, sehingga
  render awal aplikasi tetap cepat.

## Catatan Arsitektur

- **Backend tetap sumber kebenaran**: semua logika keuangan (validasi, pajak, kurs,
  nomor invoice, batch, share token) tetap di Apps Script + Spreadsheet/Drive.
- **Auth** menggunakan `username` + `token` sesi (dihasilkan `doLoginCheck`).
  Token disimpan di `localStorage` + zustand persist; dikirim pada setiap request.
- **Caching data** memakai TanStack Query (staleTime per query) sehingga render cepat
  dan minim panggilan Apps Script.
- **Tema** light/dark memakai CSS variables (`:root` / `[data-theme=dark]`) di `index.css`.