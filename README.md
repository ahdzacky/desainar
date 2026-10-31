# DES<sup>AI</sup>N<sup>AR</sup>

**Your AI Interior Design & AR Furniture Specialist.** Potret ruangan, dan Gemma 4 akan:

1. mengenali tipe ruangan dan skalanya,
2. memetakan zona kosong, arah cahaya, dan bidang dinding langsung di atas foto (**Gambar Analisa**),
3. membaca palet warna 60-30-10 dan merekomendasikan cat dinding baru,
4. memilih furniture dari katalog 3D, yang bisa langsung dicoba di ruangan nyata dengan skala 1:1 lewat **WebAR**,
5. menulis prompt konsep desain untuk gambar **After**.

Dibuat di Hacktoberfest Hack Day Kota Batam x Batam Innovation Center (MLH), 31 Oktober 2026.

## Cara kerja

```
Browser (HP)
 ├─ foto dikompres (≤1024 px) → POST /api/analyze
 │     └─ Vercel Function → Gemini API: Gemma 4 (gemma-4-26b-a4b-it / gemma-4-31b-it)
 │           └─ JSON divalidasi: item_id harus ada di katalog, koordinat & hex dicek
 ├─ Gambar Analisa: anotasi Gemma digambar di atas foto (koordinat %)
 ├─ Desain AI: prompt dari Gemma → Pollinations (dari browser dulu, lalu proxy /api/render)
 │     tanpa key: model gratis "sana" (alias DreamShaper 8 LCM) · dengan key: FLUX.1 [schnell]
 └─ AR: Google <model-viewer> (WebXR / Scene Viewer / Quick Look)
```

- **Instant** (`gemma-4-26b-a4b-it`, MoE dengan ±4B parameter aktif) dipakai sebagai default. **Deep** (`gemma-4-31b-it`, dense) untuk analisa yang lebih teliti, dan otomatis dialihkan ke Instant kalau server sedang sibuk. Thinking dimatikan di kedua mode supaya cepat.
- Setiap analisa terdiri dari dua panggilan Gemma yang berjalan paralel: analisa ruang dan warna, lalu rekomendasi furniture dan prompt render. Jawabannya dalam Bahasa Inggris, dengan JSON mode.
- API key hanya ada di server. Repo ini publik, dan key tidak pernah dikirim ke browser.
- Tombol "Try the sample photo" memuat hasil Gemma yang sudah tersimpan (plus render statis), jadi demo tetap jalan walaupun jaringan bermasalah.
- Tampilan mengikuti design system "Architectural Sapphire": permukaan putih, garis tipis, aksen biru safir, dan font Plus Jakarta Sans.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi GEMINI_API_KEY dari https://aistudio.google.com/apikey
npm run dev                  # http://localhost:5173 (+ /api/analyze lewat middleware Vite)
```

AR butuh HTTPS. Untuk mengetesnya di HP, gunakan URL deploy Vercel.

**Deploy:** import repo ke Vercel (preset Vite), lalu set env `GEMINI_API_KEY`.

**Opsional:** isi env `POLLINATIONS_KEY` dengan secret key (`sk_`) dari [enter.pollinations.ai](https://enter.pollinations.ai). Tanpa key, layanan gratis Pollinations hanya memberi 1 gambar per 45 detik per IP. Karena itu render dicoba dari browser pengguna dulu, dan proxy `/api/render` dipakai sebagai cadangan.

## Struktur

| Path | Isi |
|------|-----|
| `server/analyze.js` | Prompt Gemma 4, pemanggilan Gemini API, validasi JSON |
| `api/analyze.js` | Vercel Function yang membungkus `server/analyze.js` |
| `server/render.js`, `api/render.js` | Proxy render Pollinations yang hanya meneruskan gambar asli |
| `src/data/catalog.js` | Katalog furniture 3D (Gemma hanya boleh memilih id dari sini) |
| `src/data/options.js` | Gaya desain, tipe ruangan, mesin Gemma |
| `src/components/` | UI: pemilih gaya, panel visual, insight warna, panggung AR |
| `scripts/fetch-polyhaven.mjs` | Unduh model Poly Haven lalu kemas jadi `.glb` |

## Kredit

- Model 3D: [Poly Haven](https://polyhaven.com) (CC0)
- Foto contoh: [Unsplash](https://unsplash.com) (Unsplash License)
- Konsep render: [Pollinations](https://pollinations.ai)
- AR: [Google &lt;model-viewer&gt;](https://modelviewer.dev)
- Analisa ruangan: Gemma 4 lewat Gemini API

## Lisensi

[MIT](LICENSE) © 2026 Ahmad Miftahul Zaki
