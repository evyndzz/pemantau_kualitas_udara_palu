import type { ISPUCategory, ISPUInfo } from '../types';

export function calculatePM25ISPU(pm25: number): number {
  if (pm25 <= 0) return 0;
  if (pm25 <= 15.5) {
    return Math.round((50 / 15.5) * pm25);
  }
  if (pm25 <= 55.4) {
    return Math.round(((100 - 51) / (55.4 - 15.6)) * (pm25 - 15.6) + 51);
  }
  if (pm25 <= 150.4) {
    return Math.round(((200 - 101) / (150.4 - 55.5)) * (pm25 - 55.5) + 101);
  }
  if (pm25 <= 250.4) {
    return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  }
  return Math.round(((500 - 301) / (500.0 - 250.5)) * Math.min(pm25 - 250.5, 249.5) + 301);
}

export function calculatePM10ISPU(pm10: number): number {
  if (pm10 <= 0) return 0;
  if (pm10 <= 50) {
    return Math.round((50 / 50) * pm10);
  }
  if (pm10 <= 150) {
    return Math.round(((100 - 51) / (150 - 51)) * (pm10 - 51) + 51);
  }
  if (pm10 <= 350) {
    return Math.round(((200 - 101) / (350 - 151)) * (pm10 - 151) + 101);
  }
  if (pm10 <= 420) {
    return Math.round(((300 - 201) / (420 - 351)) * (pm10 - 351) + 201);
  }
  return Math.round(((500 - 301) / (600 - 421)) * Math.min(pm10 - 421, 179) + 301);
}

export function getISPUDetails(score: number): ISPUInfo {
  if (score <= 50) {
    return {
      score,
      category: 'BAIK',
      colorName: 'Hijau',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      borderClass: 'border-emerald-500',
      textClass: 'text-emerald-400',
      badgeBg: 'bg-emerald-500 text-slate-950',
      ringClass: 'ring-emerald-500/30 shadow-emerald-500/20',
      hazeRisk: 'Aman',
      description: 'Kualitas udara sangat baik. Tidak ada risiko kesehatan atau dampak asap kebakaran.',
      actionAdvice: 'Aktivitas luar ruangan aman untuk semua orang. Ventilasi udara rumah dapat dibuka leluasa.',
      maskRecommendation: 'Tidak diperlukan masker untuk perlindungan polusi udara.',
      outdoorAdvice: 'Aman untuk jogging, olahraga luar ruangan, dan aktivitas anak-anak.',
      vulnerableGroupAdvice: 'Semua kelompok aman, tidak ada pembatasan aktivitas fisik.',
    };
  }

  if (score <= 100) {
    return {
      score,
      category: 'SEDANG',
      colorName: 'Biru',
      bgClass: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      borderClass: 'border-sky-500',
      textClass: 'text-sky-400',
      badgeBg: 'bg-sky-500 text-slate-950',
      ringClass: 'ring-sky-500/30 shadow-sky-500/20',
      hazeRisk: 'Waspada Asap',
      description: 'Kualitas udara dapat diterima. Terdapat sedikit partikel debu halus atau sisa asap di udara.',
      actionAdvice: 'Masyarakat umum dapat beraktivitas normal. Kelompok sangat sensitif perlu waspada terhadap batuk atau iritasi.',
      maskRecommendation: 'Kelompok penderita asma/alergi disarankan menyiapkan masker jika sensitif.',
      outdoorAdvice: 'Aktivitas luar ruangan masih aman, pantau perubahan arah tiupan asap.',
      vulnerableGroupAdvice: 'Penderita asma & anak balita sebaiknya tidak terlalu lama terpapar udara luar jika mulai berbau sangit.',
    };
  }

  if (score <= 200) {
    return {
      score,
      category: 'TIDAK SEHAT',
      colorName: 'Kuning',
      bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      borderClass: 'border-amber-500',
      textClass: 'text-amber-400',
      badgeBg: 'bg-amber-500 text-slate-950',
      ringClass: 'ring-amber-500/30 shadow-amber-500/20',
      hazeRisk: 'Siaga Asap',
      description: 'Udara mulai tercemar kabut asap karhutla. Mulai merugikan kesehatan kelompok sensitif dan masyarakat.',
      actionAdvice: 'Kurangi aktivitas di luar ruangan. Tutup pintu dan jendela rumah agar asap kebakaran tidak masuk ke dalam.',
      maskRecommendation: 'Wajib gunakan masker (minimal masker bedah atau masker N95/KF94) jika terpaksa keluar.',
      outdoorAdvice: 'Hindari olahraga berat di luar ruangan (seperti lari atau bersepeda).',
      vulnerableGroupAdvice: 'Lansia, ibu hamil, balita, dan penderita asma/jantung HARUS tetap berada di dalam ruangan.',
    };
  }

  if (score <= 300) {
    return {
      score,
      category: 'SANGAT TIDAK SEHAT',
      colorName: 'Merah',
      bgClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      borderClass: 'border-rose-500',
      textClass: 'text-rose-400',
      badgeBg: 'bg-rose-500 text-white',
      ringClass: 'ring-rose-500/40 shadow-rose-500/30',
      hazeRisk: 'Darurat Asap',
      description: 'Kabut asap pekat. Berbahaya bagi kesehatan seluruh populasi dengan peningkatan gejala ISPA secara drastis.',
      actionAdvice: 'Tetap berada di dalam ruangan tertutup. Nyalakan air purifier atau pasang kain basah di celah jendela.',
      maskRecommendation: 'WAJIB gunakan masker respirator N95/KN95/KF94 saat beraktivitas di luar.',
      outdoorAdvice: 'HENTIKAN seluruh aktivitas luar ruangan, olahraga, dan kegiatan sekolah luar ruang.',
      vulnerableGroupAdvice: 'Kelompok rentan berisiko tinggi sesak napas darurat. Segera hubungi fasilitas kesehatan jika nafas berat.',
    };
  }

  return {
    score,
    category: 'BERBAHAYA',
    colorName: 'Hitam / Marun',
    bgClass: 'bg-purple-950/40 border-purple-500/50 text-purple-300',
    borderClass: 'border-purple-500',
    textClass: 'text-purple-300',
    badgeBg: 'bg-purple-600 text-white',
    ringClass: 'ring-purple-500/50 shadow-purple-500/40',
    hazeRisk: 'Darurat Asap',
    description: 'Status darurat pencemaran udara ekstrem akibat karhutla parah. Seluruh populasi terdampak serius.',
    actionAdvice: 'DARURAT! Jangan keluar rumah sama sekali. Tutup semua celah ventilasi. Hubungi call center darurat jika butuh tabung oksigen.',
    maskRecommendation: 'Respirator N95/FFP2 tertutup rapat mutlak diperlukan bila evakuasi.',
    outdoorAdvice: 'DILARANG beraktivitas di luar ruangan. Jarak pandang sangat rendah dan berbahaya.',
    vulnerableGroupAdvice: 'Evakuasi ke posko udara bersih atau ruangan dengan filtrasi HEPA jika memungkinkan.',
  };
}

export function getISPUColorHex(category: ISPUCategory): string {
  switch (category) {
    case 'BAIK':
      return '#10b981'; // Green
    case 'SEDANG':
      return '#38bdf8'; // Blue
    case 'TIDAK SEHAT':
      return '#f59e0b'; // Amber / Yellow
    case 'SANGAT TIDAK SEHAT':
      return '#ef4444'; // Red
    case 'BERBAHAYA':
      return '#881337'; // Deep Maroon / Black
  }
}

export function formatWITA(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ' WITA';
  } catch {
    return isoString;
  }
}

export function formatHourShort(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

export function getWindDirectionLabel(deg: number): string {
  const directions = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
  const index = Math.round(((deg % 360) / 45)) % 8;
  return directions[index];
}
