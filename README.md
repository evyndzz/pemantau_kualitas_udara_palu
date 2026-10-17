# 🌿 Pemantau Kualitas Udara Sulawesi Tengah (Sulteng)

Aplikasi web pemantau kualitas udara, konsentrasi partikulat (PM2.5 & PM10), serta peringatan bahaya kabut asap akibat kebakaran hutan dan lahan (karhutla) untuk seluruh wilayah Sulawesi Tengah secara **real-time**, **100% gratis**, tanpa batas kuota API, dan siap di-deploy langsung ke **Vercel** atau **Netlify**.

---

## 🌟 Fitur Utama

1. **Standar Nasional ISPU KLHK & Internasional US AQI**
   - Perhitungan resmi berdasarkan **Permen LHK No. 14 Tahun 2020** untuk parameter PM2.5 dan PM10.
   - Kategorisasi warna standar: Baik (Hijau), Sedang (Biru), Tidak Sehat (Kuning), Sangat Tidak Sehat (Merah), Berbahaya (Hitam/Ungu Gelap).
   - Perbandingan rasio terhadap pedoman batas tahunan WHO (5 µg/m³ untuk PM2.5).

2. **Cakupan Lengkap 13 Kabupaten & Kota di Sulawesi Tengah**
   - Kota Palu, Kab. Donggala, Kab. Sigi, Kab. Parigi Moutong, Kab. Poso, Kab. Tojo Una-Una, Kab. Tolitoli, Kab. Buol, Kab. Morowali, Kab. Morowali Utara, Kab. Banggai, Kab. Banggai Kepulauan, Kab. Banggai Laut.
   - Dilengkapi tombol deteksi lokasi otomatis via GPS perangkat pengguna.

3. **Peta Interaktif Sebaran Kualitas Udara**
   - Menggunakan peta Leaflet dengan CartoDB dark tile.
   - Titik penanda (marker) interaktif dengan kode warna ISPU dan animasi denyut (*pulse*) saat daerah berstatus tidak sehat atau berbahaya.

4. **Deteksi Indikator Karhutla & Kabut Asap Khusus**
   - **Karbon Monoksida (CO)**: Penanda khas asap pembakaran biomassa/hutan.
   - **Debu & Pasir (Dust)**: Deteksi partikel debu halus dan kasar di atmosfer.
   - **Ketebalan Optik Aerosol (AOD - Aerosol Optical Depth)**: Mengukur keparahan penurunan jarak pandang akibat kabut asap tebal.
   - **Arah & Kecepatan Angin (10m)**: Mengetahui ke mana arah sebaran asap tertiup.
   - **Kelembapan Relatif & Potensi Percikan Api**: Indikasi kemudahan api menjalar saat udara kering.

5. **Prakiraan Kualitas Udara Per Jam (36 Jam ke Depan)**
   - Grafik interaktif responsif untuk memprediksi puncak lonjakan asap PM2.5.

6. **Panduan Kesehatan & Kesiapsiagaan Bencana**
   - Rekomendasi tindakan medis berbasis standar Kemenkes RI dan WHO (penggunaan masker N95/KF94, pembersih udara, peringatan kelompok rentan seperti penderita ISPA/asma, anak-anak, lansia, dan ibu hamil).

7. **Tombol Cepat Bagikan Status via WhatsApp**
   - Memudahkan warga menyebarkan peringatan dini kondisi udara ke grup keluarga, RT/RW, dan komunitas secara instan.

8. **Kontak Darurat Terpadu Sulawesi Tengah**
   - Akses cepat nomor darurat 112, Call Center BPBD Prov Sulteng, Damkar Palu, Brigade Karhutla Manggala Agni, PSC 119, dan RSUD Undata Palu.

---

## 🛠️ Teknologi & Sumber Data

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Icon**: Lucide React
- **Peta**: Leaflet
- **Sumber Data Terbuka**: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) & [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs)
  - Data satelit dan model atmosfer global Copernicus Atmosphere Monitoring Service (CAMS) & ECMWF.
  - **Bebas biaya**, tidak memerlukan pendaftaran akun, dan **tanpa API key** (tidak akan habis kuota).

---

## 🚀 Panduan Menjalankan di Lokal

### Prasyarat
- Node.js versi 18 atau lebih tinggi
- npm atau pnpm

```bash
# 1. Masuk ke folder proyek
cd pemantau_kualitasUdara

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```

Buka peramban di `http://localhost:5173`.

---

## 🌐 Panduan Deploy Gratis (Vercel & Netlify)

Aplikasi ini telah dilengkapi konfigurasi `vercel.json` dan `netlify.toml` untuk mendukung Single Page Application (SPA) routing dan caching header.

### Cara 1: Deploy ke Vercel (Rekomendasi)

1. Unggah kode ke repositori GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi pemantau kualitas udara sulteng"
   git branch -M main
   git remote add origin https://github.com/<username-anda>/pemantau-kualitas-udara-sulteng.git
   git push -u origin main
   ```
2. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
3. Klik **"Add New Project"** -> Pilih repositori `pemantau-kualitas-udara-sulteng`.
4. Framework Preset akan otomatis terdeteksi sebagai **Vite**.
5. Klik **"Deploy"**. Web langsung aktif dan dapat diakses publik melalui domain `.vercel.app`.

### Cara 2: Deploy ke Netlify

1. Buka [netlify.com](https://netlify.com) dan login.
2. Klik **"Add new site"** -> **"Import an existing project"** -> Pilih **GitHub**.
3. Pilih repositori Anda.
4. Build command: `npm run build`, Publish directory: `dist`.
5. Klik **"Deploy site"**. Web langsung aktif dengan URL `.netlify.app`.

---

## 📄 Lisensi & Tanggung Jawab

Data kualitas udara disediakan oleh Open-Meteo berdasarkan model atmosfer numerik CAMS/ECMWF. Untuk rilis resmi status darurat bencana karhutla, selalu ikuti arahan resmi dari BPBD Provinsi Sulawesi Tengah, BMKG, dan KLHK.

