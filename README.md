# AirNav Billing — Front-end (Vercel)

Halaman pembungkus ringkas untuk memuat Web App **Google Apps Script** di dalam
iframe, lalu **menyembunyikan banner Google** dengan teknik overscan+transform.
Hasil: URL pendek (bukan `script.google.com`) dan tampilan bersih tanpa banner.

## Struktur

```
vercel-front/
├─ vercel.json        # Route: / , /b/:bid/:token , /d/:rid/:token
├─ app.html           # Aplikasi admin   → iframe Apps Script (tanpa param)
├─ batch.html         # Portal tagihan   → iframe ?batch=1&bid=..&t=..
├─ doc.html           # Download dokumen → iframe ?doc=1&rid=..&t=..
├─ js/
│  ├─ config.js       # ★ SATU file yang perlu diedit (URL exec + offset banner)
│  └─ embed.js        # Memuat & menyembunyikan banner
└─ css/
   └─ base.css        # Gaya dark full-screen + loading
```

## Konfigurasi (penting)

Buka `js/config.js` lalu sesuaikan:

- `APPSCRIPT_URL` — URL `/exec` Web App Apps Script Anda (dari deployment).
- `BANNER_HIDE_PX` — tinggi banner Google yang disembunyikan (px). Default `42`.
  - Banner masih tampak separuh → tambah nilainya.
  - Konten bawah terpotong      → kurangi nilainya.
- `APP_NAME` — judul situs.

> `PUBLIC_BASE_URL` di sisi **Apps Script** (`code.gs`) harus sama dengan domain
> Vercel ini, agar link batch/per-item yang di-share via WhatsApp menjadi URL
> ringkas (mis. `https://airnav-billing.vercel.app/b/BATCH-ID/TOKEN`).

## Rute

| Pola | Tujuan iframe |
|------|----------------|
| `/` | Aplikasi admin |
| `/b/:bid/:token` | Portal tagihan batch |
| `/d/:rid/:token` | Download dokumen per-item |

## Deploy ke Vercel

1. Push folder `vercel-front` ke **root repo GitHub** (ganti `README.md` & `index.html` lama).
2. Di Vercel: **New Project** → import repo → Framework: **Other** → Build: **Empty**.
3. Deploy. Domain jadi `https://<nama>.vercel.app`.
4. Set `PUBLIC_BASE_URL` di `code.gs` = domain itu, lalu deploy ulang Apps Script.

## Catatan keamanan

- Folder ini **tidak** berisi kredensial.
- Jangan commit password admin awal / kredensial apa pun ke repo publik.
