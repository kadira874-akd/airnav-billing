# AirNav Billing — Front-end (Vercel)

Halaman pembungkus ringkas untuk memuat Web App **Google Apps Script** di dalam
iframe. Strip abu-abu kosong yang disisipkan GAS di atas konten di-geser keluar
area tampil, sehingga panel header langsung menempel pada frame tanpa celah.

## Struktur

```
vercel-front/
├─ vercel.json        # Route: / , /b/:bid/:token , /d/:rid/:token
├─ app.html           # Aplikasi admin   → iframe Apps Script (tanpa param)
├─ batch.html         # Portal tagihan   → iframe ?batch=1&bid=..&t=..
├─ doc.html           # Download dokumen → iframe ?doc=1&rid=..&t=..
├─ js/
│  ├─ config.js       # ★ SATU file yang perlu diedit (URL exec + GAS_PANEL_PX)
│  └─ embed.js        # Memuat Apps Script dalam iframe (geser strip GAS keluar)
└─ css/
   └─ base.css        # Gaya dark full-screen + loading
```

## Konfigurasi (penting)

Buka `js/config.js` lalu sesuaikan:

- `APPSCRIPT_URL` — URL `/exec` Web App Apps Script Anda (dari deployment).
- `GAS_PANEL_PX` — tinggi strip GAS di atas konten (px). Default `30`.
  - Strip masih tampak → tambah nilainya (mis. 28, 32).
  - Header atas terpotong   → kurangi nilainya (mis. 20, 16).
  - `0` = nonaktif, pasang iframe penuh tanpa penggeseran.
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
