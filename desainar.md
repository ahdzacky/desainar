# 🏛️ Project Plan: DESAINAR
**Brand Typography:** **DES`AI`N`AR`** (Highlight pada **AI** dan **AR**)
**Tagline:** *"Your AI Interior Design & AR Furniture Specialist."*
**Event:** Hacktoberfest Hack Day Kota Batam x Batam Innovation Center (MLH)

---

## 🎯 1. Product Vision & End-to-End Flow
**DESAINAR** (*Desain + AI + AR*, terdengar seperti *Desainer*) adalah aplikasi web desain interior pintar (tanpa instalasi aplikasi) yang memadukan kemampuan multimodal **Gemma 4**, **Visual Blueprint & Concept Generation**, dan **Instant WebAR (`<model-viewer>`)**:
1. **Snap & Classify Room:** Pengguna memotret ruangan. Gemma 4 mengenali **Tipe Ruangan** (*Ruang Tamu, Ruang Keluarga, Kamar Tidur, Ruang Makan, atau Kantor/Ruang Kerja*) beserta estimasi skala ruangnya.
2. **Generate "AI Spatial Analysis Image" (Annotated Blueprint):** Berdasarkan koordinat spasial `(x, y)` yang dideteksi Gemma 4, aplikasi menggambar peta analisis visual di atas foto ruangan (menandai zona *Negative Space*, titik penempatan furniture, arah cahaya, dan *undertone* dinding).
3. **Generate "AI Interior Design Concept Image" (Visual Render):** Gemma 4 meracik prompt arsitektural detail dari ruangan tersebut (termasuk rekomendasi warna cat dinding 60-30-10 & furniture baru) untuk di-render menjadi gambar konsep desain interior.
4. **In-AR Multi-Furniture WebXR Carousel:** Pengguna memproyeksikan paket furniture 3D skala 1:1 (*Kursi/Sofa, Meja, Lemari/Rak, Tempat Tidur, Lampu/Dekorasi*) langsung ke ruangan nyata melalui browser HP.

---

## 🧠 2. AI Architecture (Gemma 4 Dual-Engine + Visual Pipeline)
1. **Spatial & Interior Reasoning Engine (`@google/genai`):**
   - **⚡ Instant Mode (Default): `gemma-4-26b-a4b-it` (MoE Architecture - 4B Active)**
   - **🧠 Deep Designer Mode: `gemma-4-31b-it` (Dense Architecture - 31B Full)**
2. **Visual Generation Pipeline:**
   - **Gambar Analisa (Spatial Blueprint):** Digenerate secara *real-time* menggunakan HTML5 `<canvas>` / interactive overlay dari output `spatial_annotations` (koordinat `%` X dan Y) milik Gemma 4.
   - **Gambar Rekomendasi Desain (Interior Concept Render):** Digenerate dari field `design_render_prompt` buatan Gemma 4 dengan fitur *Tab Switcher* & *Regenerate Variations*.

---

## 🏠 3. Room Type Classification & Modular Furniture Categories
### A. Klasifikasi Tipe Ruangan (Room Types):
1. 🛋️ **Ruang Tamu (Living Room)**
2. 📺 **Ruang Keluarga (Family / Lounge Room)**
3. 🛏️ **Kamar Tidur (Bedroom)**
4. 🍽️ **Ruang Makan (Dining Room)**
5. 💻 **Ruang Kerja / Kantor (Home Office / Workspace)**

### B. Kategori Katalog Furniture 3D (`src/data/catalog.js`):
Katalog dirancang modular agar developer dapat memasukkan file `.glb` hasil kurasi Sketchfab/Blender ke dalam 5 kategori utama:
1. **`seating`** — Kursi / Sofa / Lounge Chair / Dining Chair
2. **`table`** — Meja Kerja / Coffee Table / Meja Makan / Side Table
3. **`storage`** — Lemari / Rak Buku / Credenza / Kabinet
4. **`bed`** — Tempat Tidur / Divan / Daybed
5. **`lighting_decor`** — Lampu Lantai / Lampu Meja / Tanaman / Dekorasi

*(Standar Blender untuk semua file `.glb` di `public/models/`: Skala 1 unit = 1 meter, Origin di dasar tengah objek `(0,0,0)`, `Ctrl+A -> Apply All Transforms`, tanpa kompresi Draco agar fitur Auto-USDZ `<model-viewer>` berjalan di iOS).*

---

## 🏛️ 4. Interior Design Style Personas
1. **Japandi / Wabi-Sabi:** Kayu terang natural, garis rendah (*low-profile*), dinding *Warm Alabaster / Greige*, tenang dan organik.
2. **Modern Minimalist (Bauhaus):** *"Form follows function"*, geometris tegas, monokromatik, permukaan bersih.
3. **Industrial Loft:** Material ekspos (besi hitam, kayu kasar/gelap, kulit), struktur tegas, dan pencahayaan *warm ambient*.
4. **Mid-Century Modern:** Siluet lengkung organik, kaki kayu meruncing (*tapered legs*), kayu *walnut/teak* hangat dengan aksen ikonik.

---

## 📊 5. Structured JSON Output Schema from Gemma 4
```json
{
  "room_identification": {
    "detected_room_type": "Living Room | Family Room | Bedroom | Dining Room | Home Office",
    "room_type_label_id": "Ruang Tamu | Ruang Keluarga | Kamar Tidur | Ruang Makan | Ruang Kerja",
    "estimated_room_scale": "Compact / Medium / Spacious",
    "current_vibe": "Deskripsi singkat suasana ruang saat ini"
  },
  "spatial_annotations": [
    {
      "type": "wall_zone",
      "label": "60% Wall: Cool Grey -> Ganti ke Warm Alabaster (#E8E2D5)",
      "x_percent": 50,
      "y_percent": 25
    },
    {
      "type": "light_source",
      "label": "Sumber Cahaya Alami Samping",
      "x_percent": 82,
      "y_percent": 35
    },
    {
      "type": "placement_zone",
      "label": "Zona #1: Kursi / Sofa Lounge",
      "x_percent": 32,
      "y_percent": 68
    },
    {
      "type": "placement_zone",
      "label": "Zona #2: Meja / Rak Samping",
      "x_percent": 65,
      "y_percent": 72
    }
  ],
  "design_render_prompt": "Photorealistic interior architecture photography of a [Style Persona] [Room Type], walls painted in [Recommended Wall Name & HEX], featuring [Recommended Furniture 1, 2, 3], warm natural lighting, Architectural Digest style, 8k resolution",
  "color_and_wall_analysis": {
    "current_wall": {
      "detected_name": "Cool Light Grey-White",
      "hex": "#E5E7EB",
      "undertone": "Cool Undertone",
      "wall_critique": "Kritik desain terhadap warna dinding saat ini"
    },
    "detected_room_palette": [
      { "role": "60% Dominant (Wall)", "name": "Cool White", "hex": "#E5E7EB" },
      { "role": "30% Secondary (Floor/Wood)", "name": "Warm Oak", "hex": "#A47E58" },
      { "role": "10% Existing Accent", "name": "Charcoal", "hex": "#374151" }
    ],
    "recommended_wall_palette": [
      {
        "type": "Primary Wall Paint",
        "name": "Shoji Warm Alabaster",
        "hex": "#E8E2D5",
        "finish": "Matte / Limewash",
        "reason": "Alasan kecocokan"
      },
      {
        "type": "Accent Wall Paint",
        "name": "Kyoto Clay Greige",
        "hex": "#C2B6A3",
        "finish": "Textured Matte",
        "reason": "Alasan penempatan"
      }
    ]
  },
  "spatial_metrics": {
    "lighting_analysis": "Analisis arah & kualitas pencahayaan",
    "negative_space_balance": "Analisis sirkulasi & ruang kosong",
    "style_alignment_score": 80
  },
  "interior_critique": "2-3 kalimat kritik menyeluruh dari spesialis desain interior DESAINAR.",
  "recommendations": [
    {
      "rank": 1,
      "item_id": "ID dari catalog.js",
      "category": "seating | table | storage | bed | lighting_decor",
      "match_score": 96,
      "role_badge": "Primary Furniture",
      "color_contribution": "Kontribusi terhadap aturan 60-30-10",
      "design_reason": "Alasan kecocokan furniture",
      "ar_placement_guide": "Panduan lokasi penempatan saat mode AR aktif"
    }
  ]
}