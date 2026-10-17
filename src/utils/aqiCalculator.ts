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

/**
 * Computes a relative index/saturation percentage (8% - 99%) for the floating bubble pill
 * based on standard daily reference thresholds (WHO / KLHK).
 */
export function getPollutantPercentage(
  type: 'pm2_5' | 'pm10' | 'o3' | 'no2' | 'co',
  value: number
): number {
  const referenceThresholds = {
    pm2_5: 15.5,
    pm10: 45.0,
    o3: 100.0,
    no2: 25.0,
    co: 4000.0,
  };
  const ref = referenceThresholds[type] || 50;
  const pct = Math.round((value / ref) * 100);
  return Math.max(8, Math.min(99, pct));
}

export function getISPUDetails(score: number, usAqiScore?: number): ISPUInfo {
  const effectiveAqi = usAqiScore ?? score;

  if (score <= 50) {
    return {
      score,
      usAqiScore: effectiveAqi,
      category: 'BAIK',
      englishLabel: 'Sangat Baik',
      emoji: '',
      colorName: 'Hijau',
      colorHex: '#10B981',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300',
      borderClass: 'border-emerald-500',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500 text-white',
      pillClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60',
      ringClass: 'ring-emerald-500/20',
      hazeRisk: 'Aman',
      description: 'Kualitas udara sangat bersih dan segar. Tidak terdeteksi paparan kabut asap karhutla yang membahayakan.',
      actionAdvice: 'Sangat aman untuk beraktivitas di luar ruangan. Buka ventilasi jendela rumah untuk sirkulasi udara segar.',
      maskRecommendation: 'Tidak diperlukan masker polusi untuk aktivitas luar ruang.',
      outdoorAdvice: 'Aman untuk olahraga pagi/sore, aktivitas sekolah, dan kegiatan luar ruang.',
      vulnerableGroupAdvice: 'Seluruh kelompok masyarakat (termasuk anak-anak & lansia) dapat beraktivitas normal.',
    };
  }

  if (score <= 100) {
    return {
      score,
      usAqiScore: effectiveAqi,
      category: 'SEDANG',
      englishLabel: 'Sedang',
      emoji: '',
      colorName: 'Biru / Toska',
      colorHex: '#06B6D4',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300',
      borderClass: 'border-cyan-500',
      textClass: 'text-cyan-600 dark:text-cyan-400',
      badgeBg: 'bg-cyan-500 text-white',
      pillClass: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/60',
      ringClass: 'ring-cyan-500/20',
      hazeRisk: 'Waspada Asap',
      description: 'Kualitas udara masih dapat diterima, namun terdapat peningkatan partikel halus PM2.5 atau sisa pembakaran lahan.',
      actionAdvice: 'Masyarakat umum dapat beraktivitas normal. Kelompok yang sangat sensitif terhadap asap sebaiknya mengurangi aktivitas fisik berat.',
      maskRecommendation: 'Penderita asma/ISPA disarankan membawa masker medis atau KF94 saat bepergian.',
      outdoorAdvice: 'Aktivitas luar ruangan masih aman, pantau terus perubahan arah angin.',
      vulnerableGroupAdvice: 'Anak balita, lansia, dan penderita asma perlu waspada bila mulai tercium bau asap.',
    };
  }

  if (score <= 200) {
    return {
      score,
      usAqiScore: effectiveAqi,
      category: 'TIDAK SEHAT',
      englishLabel: 'Tidak Sehat',
      emoji: '',
      colorName: 'Kuning / Jingga',
      colorHex: '#F59E0B',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300',
      borderClass: 'border-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500 text-white',
      pillClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60',
      ringClass: 'ring-amber-500/25',
      hazeRisk: 'Siaga Asap',
      description: 'Udara tercemar kabut asap karhutla. Berisiko menimbulkan iritasi mata, batuk, dan gangguan pernapasan.',
      actionAdvice: 'Kurangi aktivitas di luar ruangan. Tutup pintu dan jendela rumah agar partikel asap tidak masuk.',
      maskRecommendation: 'Wajib gunakan masker N95, KN95, atau KF94 saat berada di luar ruangan.',
      outdoorAdvice: 'Hindari olahraga luar ruangan. Gunakan pelindung mata jika berkendara.',
      vulnerableGroupAdvice: 'Ibu hamil, balita, lansia, dan penderita asma/jantung wajib tetap di dalam ruangan.',
    };
  }

  if (score <= 300) {
    return {
      score,
      usAqiScore: effectiveAqi,
      category: 'SANGAT TIDAK SEHAT',
      englishLabel: 'Sangat Tidak Sehat',
      emoji: '',
      colorName: 'Merah',
      colorHex: '#EF4444',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300',
      borderClass: 'border-rose-500',
      textClass: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-600 text-white',
      pillClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60',
      ringClass: 'ring-rose-500/30',
      hazeRisk: 'Darurat Asap',
      description: 'Kabut asap pekat berbahaya bagi kesehatan seluruh warga. Risiko lonjakan ISPA akut sangat tinggi.',
      actionAdvice: 'Tetap di dalam ruangan tertutup. Nyalakan penyaring udara (air purifier) atau pasang kain basah di celah ventilasi.',
      maskRecommendation: 'WAJIB respirator N95/KN95 tertutup rapat apabila terpaksa keluar rumah.',
      outdoorAdvice: 'Hentikan seluruh kegiatan luar ruangan dan olahraga.',
      vulnerableGroupAdvice: 'Segera hubungi fasilitas medis (119 / RSUD) jika mengalami sesak napas.',
    };
  }

  return {
    score,
    usAqiScore: effectiveAqi,
    category: 'BERBAHAYA',
    englishLabel: 'Berbahaya',
    emoji: '',
    colorName: 'Ungu / Marun',
    colorHex: '#9333EA',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-300',
    borderClass: 'border-purple-600',
    textClass: 'text-purple-700 dark:text-purple-400',
    badgeBg: 'bg-purple-700 text-white',
    pillClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60',
    ringClass: 'ring-purple-500/30',
    hazeRisk: 'Darurat Asap',
    description: 'Darurat pencemaran asap ekstrem! Seluruh populasi berisiko mengalami dampak kesehatan serius.',
    actionAdvice: 'DARURAT! Jangan keluar rumah. Tutup rapat seluruh ventilasi dan hubungi posko BPBD/medis bila butuh bantuan oksigen.',
    maskRecommendation: 'Respirator N95/FFP2 mutlak diperlukan.',
    outdoorAdvice: 'DILARANG beraktivitas di luar ruangan.',
    vulnerableGroupAdvice: 'Prioritaskan evakuasi kelompok rentan ke ruang udara bersih.',
  };
}

export function getISPUColorHex(category: ISPUCategory): string {
  switch (category) {
    case 'BAIK':
      return '#10B981';
    case 'SEDANG':
      return '#06B6D4';
    case 'TIDAK SEHAT':
      return '#F59E0B';
    case 'SANGAT TIDAK SEHAT':
      return '#EF4444';
    case 'BERBAHAYA':
      return '#9333EA';
  }
}

export function formatWITA(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return (
      new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d) + ' WITA'
    );
  } catch {
    return isoString;
  }
}

export function formatTooltipDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
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
      hour12: false,
    })
      .format(d)
      .replace('.', ':');
  } catch {
    return '';
  }
}

export function getWindDirectionLabel(deg: number): string {
  const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  const index = Math.round((deg % 360) / 45) % 8;
  return directions[index];
}
