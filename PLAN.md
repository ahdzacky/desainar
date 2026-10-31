# DESAINAR — Rencana Build Hack Day

**Event:** Hacktoberfest Hack Day Kota Batam x Batam Innovation Center (MLH), Sabtu 31 Oktober 2026, **11:00–16:00 WIB**
**Kategori yang dikejar:** Best Use of Gemma 4 · Best Open-Source AI Project
**Tim:** 2 orang (A = coding utama, B = aset 3D, tes HP, submission)
**Ide & skema JSON lengkap:** [desainar.md](desainar.md)

---

## 1. Keputusan (31 Okt 2026)

| # | Keputusan | Alasan |
|---|-----------|--------|
| 1 | Mockup yang dibuat sebelum event hanya jadi **referensi visual**. Semua kode ditulis selama event, dan mockup tidak masuk repo. | Aturan MLH: ide boleh disiapkan sebelumnya, tapi kode dan materi project tidak boleh dipakai ulang. Kerja sebelum event bisa membuat project didiskualifikasi. |
| 2 | **Vite + React + Tailwind**. Gemma dipanggil dari Vercel Function `api/analyze.js`. | Stack yang paling dikuasai tim. Repo wajib publik, jadi API key harus tetap di server. |
| 3 | Render tab "Desain AI" pakai **Pollinations** (text-to-image, gratis, tanpa key). | Sudah dites: sekitar 7 detik per gambar. Model-nya open-weight. Konsekuensinya, gambar yang dihasilkan ruangan baru, bukan editan foto asli. |
| 4 | **Deploy ke Vercel (import dari GitHub) di jam pertama.** | WebXR wajib HTTPS. Setiap push otomatis ter-deploy, jadi bisa langsung dites di HP. |
| 5 | Model default `gemma-4-26b-a4b-it` (Instant). Mode Deep pakai `gemma-4-31b-it`. | Keduanya tersedia di Gemini API dan menerima input gambar. |

## 2. Lingkup

**MVP (wajib jadi):**
1. Ambil atau unggah foto ruangan, lalu pilih gaya (Japandi, Modern, Industrial, Mid-Century). Tipe ruangan dideteksi Gemma dan bisa diganti manual.
2. `POST /api/analyze` mengirim foto ke Gemma 4 dan menerima JSON sesuai skema di desainar.md §5.
3. Tiga tab gambar: **Foto Asli**, **Gambar Analisa** (pin dan zona dari koordinat %), dan **Desain AI**.
4. Palet 60-30-10, dua rekomendasi cat dinding, dan kritik desain.
5. Panggung AR `<model-viewer>` dengan carousel furniture dari rekomendasi Gemma (`item_id` dari katalog), plus HUD berisi alasan dan panduan posisi.
6. Tombol **"Contoh demo"** yang memuat hasil tersimpan, sebagai cadangan kalau Wi-Fi atau API bermasalah saat penjurian.

**Stretch (kalau waktu masih ada):** tombol generate variasi render, switch Instant/Deep dengan tampilan latensi asli.

**Di luar lingkup:** login, database, mewarnai ulang dinding di foto (butuh segmentasi), beberapa furniture sekaligus di AR (`<model-viewer>` hanya menampilkan satu model per sesi), pengukuran ruangan sungguhan.

## 3. Arsitektur

```
HP (browser)
 ├─ foto → kompres di canvas (≤1024 px, JPEG 0.8)
 ├─ POST /api/analyze { image, style, roomType?, mode: "instant" | "deep" }
 │     └─ Vercel Function → Gemini API (Gemma 4, systemInstruction + daftar katalog)
 │           └─ validasi: item_id harus ada di katalog, koordinat 0–100, hex valid
 ├─ <img> dari image.pollinations.ai/prompt/{design_render_prompt}
 └─ <model-viewer ar ar-modes="webxr scene-viewer quick-look">
```

Catatan teknis:
- Batas body Vercel Function 4,5 MB. Karena itu foto **harus dikompres di client** sebelum dikirim.
- Dokumentasi Gemma di Gemini API menyebut `systemInstruction` dan `thinkingLevel`, tapi **tidak menyebut JSON mode / `responseSchema`**. Langkah pertama spike: coba `responseMimeType: "application/json"` + `responseSchema`. Kalau ditolak, minta JSON lewat prompt lalu parse (buang pagar ```json), atau pakai function calling untuk mengikat skemanya.
- `thinkingLevel` diset minimal untuk mode Instant dan high untuk mode Deep. Latensi diukur saat spike.
- Koordinat dari Gemma hanya perkiraan. Tampilkan sebagai pin atau zona lunak, bukan bounding box presisi.
- `GEMINI_API_KEY` hanya disimpan di Vercel env dan `.env.local` (yang masuk `.gitignore`).
- Saat dev lokal, `/api/analyze` dijalankan lewat middleware di `vite.config.js`. Handler yang sama dipakai Vercel di production.

## 4. Katalog 3D (`src/data/catalog.js`, file di `public/models/`)

- 8–10 model yang mencakup 5 kategori: `seating`, `table`, `storage`, `bed`, `lighting_decor`.
- Field per item: `id`, `name`, `category`, `styles[]`, ukuran (m), `glb`, `poster`.
- Sumber utama: **Poly Haven** (lisensi CC0, skala nyata), dikemas jadi `.glb` tanpa Draco. Kalau memakai model dari sumber lain, cek lisensinya dan tulis atribusi di README.
- Standar: 1 unit = 1 m, origin di dasar tengah objek, ukuran file sekitar 5 MB atau kurang, tekstur 1k.

## 5. Jadwal (WIB)

| Waktu | A (coding) | B |
|-------|-----------|---|
| 11:55–12:15 | Scaffold, push ke GitHub, import ke Vercel, set `GEMINI_API_KEY` | Check-in MLH (masing-masing anggota), kumpulkan 3–5 foto ruangan uji |
| 12:15–12:45 | Spike Gemma: `api/analyze.js`, prompt, parse JSON, uji pakai foto | Kurasi model Poly Haven → `public/models/` + `catalog.js` |
| 12:45–13:45 | UI: unggah/kamera → hasil, tiga tab, palet dan cat dinding | Lanjut model 3D, buat poster `.webp`, cek skala tiap model |
| 13:45–14:30 | Panggung AR, carousel dari rekomendasi, HUD | Tes AR di HP Android dan iPhone lewat URL Vercel |
| 14:30–15:00 | Render Pollinations, mode Instant/Deep, loading/error, Contoh demo | Screenshot, draft teks submission |
| 15:00–15:30 | Perbaikan dari hasil tes HP, README | Tes ulang end-to-end di HP |
| 15:30–15:45 | **Code freeze.** Cek repo publik dan bebas secret | Submit project lewat MLH |
| 15:45–16:00 | Cadangan waktu | Cadangan waktu |

## 6. Checklist submission

- [ ] Repo `github.com/ahdzacky/desainar` publik dan **tetap publik setelah event**.
- [ ] Tidak ada API key di riwayat git (`git log -p | grep -i "AIza"` hasilnya kosong).
- [ ] URL demo Vercel bisa dibuka dari HP.
- [ ] Project masuk dua kategori: Best Use of Gemma 4 dan Best Open-Source AI Project.
- [ ] Alat AI yang dipakai saat coding dicantumkan di submission (aturan MLH mewajibkan transparansi).
- [ ] Siapkan demo langsung, bukan pitch. Juri MLH menilai Technology, Design, Completion, dan Learning.

## 7. Risiko

| Risiko | Mitigasi |
|--------|----------|
| Gemma 4 menolak JSON mode | Fallback ke prompt + parse, atau function calling. Diselesaikan saat spike jam pertama. |
| Respons Gemma lambat | Mode Instant jadi default, thinking minimal, loading state bertahap. |
| Wi-Fi venue atau kuota API bermasalah saat penjurian | Tombol "Contoh demo" memuat JSON yang tersimpan. |
| AR tidak jalan di HP juri | Android pakai WebXR atau Scene Viewer. iPhone pakai Quick Look (tanpa carousel di dalam AR). |
| Pollinations lambat atau down | Tetap tampilkan gambar analisa, ditambah tombol coba lagi. |
| Model 3D terlalu berat | Ukuran file dibatasi sekitar 5 MB dengan tekstur 1k. |
