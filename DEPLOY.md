# Panduan Deploy ke GitHub + Vercel

Panduan langkah-demi-langkah untuk mem-push project Airnav-Billing (React frontend
di `frontend/`, backend Apps Script tetap di Google) ke GitHub, lalu menjalankannya
online via Vercel.

---

## PRASYARAT

1. **Akun GitHub** — daftar di https://github.com jika belum punya.
2. **Git di komputer** — sudah terinstall (cek: `git --version`).
3. **Akun Vercel** — https://vercel.com (login pakai GitHub).
4. **Node.js** — sudah ada (node v24).
5. **GitHub CLI (`gh`)** — TIDAK diperlukan. Semua langkah memakai Git + web browser.

---

## BAGIAN 1 — Inisialisasi Repo Git Lokal

Jalankan semua perintah ini dari root project:

```
cd C:\projects\Airnav-Billing
```

### 1.1 Inisialisasi repo

```
git init
```

### 1.2 Set branch utama jadi `main` (standar GitHub)

```
git branch -M main
```

### 1.3 Cek bahwa file yang benar akan di-push

```
git status
```

Harapanya tampak:
- `backend/API.gs`, `backend/appsscript.json`
- `frontend/` (kecuali `node_modules`, `dist` — sudah di-ignore)
- `.gitignore`, `README.md`, `DEPLOY.md`

⚠️ **JANGAN ada** `frontend/node_modules` atau `frontend/dist` ter-push.
Kalau muncul, hentikan dan cek `.gitignore`.

### 1.4 Stage semua file

```
git add -A
```

### 1.5 Buat commit pertama

```
git commit -m "feat: AirNav Billing React SPA + Apps Script API bridge"
```

Jika Git menolak karena belum tahu identitas, jalankan sekali:

```
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"
```

lalu ulangi commit.

---

## BAGIAN 2 — Buat Repo di GitHub

### 2.1 Buka GitHub & buat repo baru

1. Buka https://github.com/new
2. Isi:
   - **Repository name**: `airnav-billing` (atau nama lain)
   - **Description**: `AirNav Advance & Extend Billing System — React SPA + Apps Script`
   - **Visibility**: `Private` (disarankan — berisi data internal) atau `Public`
3. **JANGAN centang** "Add a README file", "Add .gitignore", atau "Choose a license"
   (repo harus kosong — jadi mudah di-push dari lokal).
4. Klik **Create repository**.

### 2.2 Hubungkan repo lokal ke GitHub

Sesudah repo dibuat, GitHub menampilkan URL. Salin URL-nya, lalu jalankan:

```
git remote add origin https://github.com/NAMA-USER/airnav-billing.git
```

Ganti `NAMA-USER` dengan username GitHub Anda.

### 2.3 Push ke GitHub

```
git push -u origin main
```

Pertama kali, browser akan minta login GitHub (window pop-up) — izinkan.

### 2.4 Verifikasi

Buka `https://github.com/NAMA-USER/airnav-billing` di browser.
Semua file project harus tampil. Jika tidak, ulangi BAGIAN 1.

---

## BAGIAN 3 — Deploy Frontend ke Vercel

### 3.1 Import project di Vercel

1. Buka https://vercel.com/new
2. Pilih **Continue with GitHub** → otorisasi Vercel mengakses repo Anda.
3. Import repo **`airnav-billing`**.

### 3.2 ⚠️ PENTING — Set konfigurasi build

Vercel akan auto-detect. Pastikan setelan ini BENAR (frontend ada di subfolder):

| Setting | Nilai |
|---|---|
| **Root Directory** | `frontend` ← klik Select dan pilih folder `frontend/` |
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

Jika Vercel tidak auto-mengisi, isi manual persis seperti tabel di atas.

### 3.3 ⚠️ PENTING — Set Environment Variable

Frontend butuh URL Web App Apps Script. Di halaman project Vercel:

1. Buka tab **Settings → Environment Variables**.
2. Tambahkan:

| Key | Value |
|---|---|
| `VITE_APPSCRIPT_URL` | `https://script.google.com/macros/s/AKfycbw1r71lZLHn8SiB8va2bx_Lw7QA-qxZVNV-q6JzhXhW-Y_hPmG7pcmLL3A6a34giRXc3A/exec` |

> Pakai URL `/exec` dari deployment Apps Script yang **SESUDAH** ditambah file
> `backend/API.gs` (lihat README bagian "Cara Pasang Backend"). Tanpa ini,
> aplikasi tidak bisa login karena `APPSCRIPT_URL` default `/api` tidak ada
> di Vercel.

### 3.4 Deploy

Klik **Deploy**. Tunggu build selesai (sekitar 1–2 menit).

#### Jika gagal di langkah build

Error paling umum — `npm run build` gagal karena paket utama tidak ada.

**Solusi 1: Vercel jail / cache bersih**
```
# Di halaman project Vercel: Settings → Advanced → Clear build cache → Buka Protect deactivate → redeploy
# atau
# Vercel CLI:
```

**Solusi 2 (pasti): pakai Vercel CLI**

```
npm i -g vercel
cd C:\projects\Airnav-Billing\frontend
vercel --prod
```

CLI akan tanya:
- `Set up and deploy`? → **Yes**
- `Which scope`? → pilih akun
- `Link to existing project?` → **No** (atau Yes jika sudah ada)
- `In which directory is your code located?` → `.` (sudah berada di `frontend/`)
- `Auto-detected Project Settings (Vite - JavaScript)`? → **Yes**
- `Want to override the settings?` → **No**
- `Use existing settings`? → default

CLI lalu build & deploy langsung, memakai `frontend/` sebagai root (`vercel.json` di
dalam `frontend/` sudah mengatur SPA rewrite).

### 3.5 Verifikasi hasil

- Buka URL domain Vercel Anda, mis. `https://airnav-billing.vercel.app`.
- Anda harusnya melihat **halaman login**.
- Test login dengan akun yang ada di Spreadsheet.

---

## BAGIAN 4 — Penyempurnaan (Opsional)

### 4.1 Domain kustom

Vercel → project → **Settings → Domains** → tambah domain (mis. `billing.airnav.co.id`).
Ikuti instruksi konfigurasi DNS di panel domain Anda.

### 4.2 Update setelah ada perubahan kode

```
cd C:\projects\Airnav-Billing
git add -A
git commit -m "deskripsi perubahan"
git push
```

Vercel otomatis trigger build baru setiap `git push` ke `main` (auto-deploy).

### 4.3 Production branch

Pastikan di Vercel → **Settings → Git → Production Branch** = `main`.

---

## TROUBLESHOOTING

| Masalah | Solusi |
|---|---|
| Login gagal di produksi | Pastikan `VITE_APPSCRIPT_URL` di-set Vercel, dan Apps Script sudah deploy ulang dengan `API.gs` |
| CORS saat login | Deployment Apps Script harus **Execute as: Me, Access: Anyone** |
| Blank page (putih) | Cek Console browser: pastikan route `/login` diakses, bukan path lain yang belum ada |
| Build gagal di Vercel tapi jalan lokal | Bersihkan build cache Vercel, atau pakai Vercel CLI (Bagian 3.4) |
| `node_modules` ter-push | Jalankan `git rm -r --cached frontend/node_modules`, lalu commit & push ulang |