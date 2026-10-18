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
 * AccuWeather (Plume Labs) AQI Sub-Index Calculators
 * Verified against live AccuWeather Indonesia Air Quality pages:
 * - PM2.5 = 42 µg/m³ -> 120 AQI ("Tidak Sehat")
 * - PM10  = 62 µg/m³ -> 74 AQI  ("Buruk")
 * - NO2   = 17 µg/m³ -> 34 AQI  ("Lumayan")
 * - O3    = 40 µg/m³ -> 13 AQI  ("Bagus Sekali")
 * - CO    = 666 µg/m³ -> 7 AQI  ("Bagus Sekali")
 */
export function calculateAccuWeatherPM25AQI(pm25: number): number {
  if (pm25 <= 0) return 0;
  if (pm25 <= 10) return Math.round((pm25 / 10) * 20);
  if (pm25 <= 20) return Math.round(20 + ((pm25 - 10) / 10) * 30);
  if (pm25 <= 35) return Math.round(50 + ((pm25 - 20) / 15) * 50);
  if (pm25 <= 52.5) return Math.round(100 + ((pm25 - 35) / 17.5) * 50);
  if (pm25 <= 100) return Math.round(150 + ((pm25 - 52.5) / 47.5) * 50);
  return Math.round(200 + ((pm25 - 100) / 50) * 50);
}

export function calculateAccuWeatherPM10AQI(pm10: number): number {
  if (pm10 <= 0) return 0;
  if (pm10 <= 20) return Math.round((pm10 / 20) * 20);
  if (pm10 <= 50) return Math.round(20 + ((pm10 - 20) / 30) * 30);
  if (pm10 <= 75) return Math.round(50 + ((pm10 - 50) / 25) * 50);
  if (pm10 <= 150) return Math.round(100 + ((pm10 - 75) / 75) * 50);
  return Math.round(150 + ((pm10 - 150) / 100) * 50);
}

export function calculateAccuWeatherNO2AQI(no2: number): number {
  if (no2 <= 0) return 0;
  if (no2 <= 25) return Math.round((no2 / 25) * 50);
  if (no2 <= 100) return Math.round(50 + ((no2 - 25) / 75) * 50);
  return Math.round(100 + ((no2 - 100) / 100) * 50);
}

export function calculateAccuWeatherO3AQI(o3: number): number {
  if (o3 <= 0) return 0;
  if (o3 <= 60) return Math.round((o3 / 60) * 20);
  if (o3 <= 100) return Math.round(20 + ((o3 - 60) / 40) * 30);
  if (o3 <= 160) return Math.round(50 + ((o3 - 100) / 60) * 50);
  return Math.round(100 + ((o3 - 160) / 60) * 50);
}

export function calculateAccuWeatherCOAQI(co: number): number {
  if (co <= 0) return 0;
  if (co <= 2000) return Math.max(1, Math.round((co / 2000) * 20));
  if (co <= 4000) return Math.round(20 + ((co - 2000) / 2000) * 30);
  return Math.round(50 + ((co - 4000) / 6000) * 50);
}

export function calculateAccuWeatherOverallAQI(
  pm25: number,
  pm10: number,
  no2 = 0,
  o3 = 0,
  co = 0
): number {
  return Math.max(
    calculateAccuWeatherPM25AQI(pm25),
    calculateAccuWeatherPM10AQI(pm10),
    calculateAccuWeatherNO2AQI(no2),
    calculateAccuWeatherO3AQI(o3),
    calculateAccuWeatherCOAQI(co)
  );
}

export function getAccuWeatherCategoryLabel(aqi: number): string {
  if (aqi <= 19) return 'Bagus Sekali';
  if (aqi <= 49) return 'Lumayan';
  if (aqi <= 99) return 'Buruk';
  if (aqi <= 149) return 'Tidak Sehat';
  if (aqi <= 249) return 'Sangat Tidak Sehat';
  return 'Berbahaya';
}

/**
 * Computes the AccuWeather AQI sub-index for the floating map bubble & pollutant cards
 */
export function getPollutantPercentage(
  type: 'pm2_5' | 'pm10' | 'o3' | 'no2' | 'co',
  value: number
): number {
  switch (type) {
    case 'pm2_5':
      return Math.max(1, calculateAccuWeatherPM25AQI(value));
    case 'pm10':
      return Math.max(1, calculateAccuWeatherPM10AQI(value));
    case 'no2':
      return Math.max(1, calculateAccuWeatherNO2AQI(value));
    case 'o3':
      return Math.max(1, calculateAccuWeatherO3AQI(value));
    case 'co':
      return Math.max(1, calculateAccuWeatherCOAQI(value));
  }
}

export function getISPUDetails(score: number, usAqiScore?: number): ISPUInfo {
  const effectiveAqi = usAqiScore ?? score;
  const evalScore = Math.max(score, effectiveAqi);

  if (evalScore <= 50) {
    return {
      score,
      usAqiScore: effectiveAqi,
      category: 'BAIK',
      englishLabel: getAccuWeatherCategoryLabel(effectiveAqi),
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
      description: 'Kualitas udara sangat ideal bagi sebagian besar orang; nikmati aktivitas normal Anda di luar ruangan.',
      actionAdvice: 'Sangat aman untuk beraktivitas di luar ruangan. Buka ventilasi jendela rumah untuk sirkulasi udara segar.',
      maskRecommendation: 'Tidak diperlukan masker polusi untuk aktivitas luar ruang.',
      outdoorAdvice: 'Aman untuk olahraga pagi/sore, aktivitas sekolah, dan kegiatan luar ruang.',
      vulnerableGroupAdvice: 'Seluruh kelompok masyarakat (termasuk anak-anak & lansia) dapat beraktivitas normal.',
    };
  }

  if (evalScore <= 100) {
    return {
      score,
      usAqiScore: effectiveAqi,
      category: 'SEDANG',
      englishLabel: getAccuWeatherCategoryLabel(effectiveAqi),
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
      description: 'Udara telah mencapai tingkat polusi sedang. Kelompok yang sensitif sebaiknya mengurangi aktivitas di luar ruangan jika mengalami gejala pernapasan.',
      actionAdvice: 'Masyarakat umum dapat beraktivitas normal. Kelompok yang sangat sensitif terhadap asap sebaiknya mengurangi aktivitas fisik berat.',
      maskRecommendation: 'Penderita asma/ISPA disarankan membawa masker medis atau KF94 saat bepergian.',
      outdoorAdvice: 'Aktivitas luar ruangan masih dapat dilakukan, pantau terus perubahan arah angin.',
      vulnerableGroupAdvice: 'Anak balita, lansia, dan penderita asma perlu waspada bila mulai tercium bau asap.',
    };
  }

  if (evalScore <= 200) {
    return {
      score,
      usAqiScore: effectiveAqi,
      category: 'TIDAK SEHAT',
      englishLabel: getAccuWeatherCategoryLabel(effectiveAqi),
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

  if (evalScore <= 300) {
    return {
      score,
      usAqiScore: effectiveAqi,
      category: 'SANGAT TIDAK SEHAT',
      englishLabel: getAccuWeatherCategoryLabel(effectiveAqi),
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
    englishLabel: getAccuWeatherCategoryLabel(effectiveAqi),
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

export function getAccuWeatherAQIColorHex(aqi: number): string {
  if (aqi <= 19) return '#10B981'; // Bagus Sekali (Hijau)
  if (aqi <= 49) return '#10B981'; // Lumayan (Hijau / Baik)
  if (aqi <= 99) return '#06B6D4'; // Buruk (Toska / Sedang)
  if (aqi <= 149) return '#F59E0B'; // Tidak Sehat (Kuning / Jingga)
  if (aqi <= 249) return '#EF4444'; // Sangat Tidak Sehat (Merah)
  return '#9333EA'; // Berbahaya (Ungu)
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
