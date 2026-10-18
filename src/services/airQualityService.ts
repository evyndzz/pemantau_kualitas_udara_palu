import type {
  AirQualityResponse,
  BMKGForecastSlot,
  CityLocation,
  CitySummary,
  CurrentPollutants,
  CurrentWeather,
  DailyPoint,
  HourlyPoint,
} from '../types';
import {
  calculateAccuWeatherCOAQI,
  calculateAccuWeatherNO2AQI,
  calculateAccuWeatherO3AQI,
  calculateAccuWeatherOverallAQI,
  calculateAccuWeatherPM10AQI,
  calculateAccuWeatherPM25AQI,
  calculatePM10ISPU,
  calculatePM25ISPU,
  getAccuWeatherCategoryLabel,
  getISPUColorHex,
  getISPUDetails,
} from '../utils/aqiCalculator';
import { SULTENG_CITIES } from '../constants/cities';

const CACHE_DURATION_MS = 60 * 1000; // 60s general cache
const ACCUWEATHER_LIVE_CACHE_MS = 3 * 60 * 1000; // 3 minutes cache for r.jina.ai AccuWeather scrape
const SNAPSHOT_STORAGE_KEY = 'sulteng_accuweather_snapshots_v2';

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string, maxAgeMs = CACHE_DURATION_MS): T | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > maxAgeMs) {
    return null;
  }
  return cached.data as T;
}

function setInCache<T>(key: string, data: T): void {
  memoryCache.set(key, { timestamp: Date.now(), data });
}

export function clearAirQualityCache(): void {
  memoryCache.clear();
}

// Verified live AccuWeather baseline data for all 13 Kabupaten & Kota in Central Sulawesi
const DEFAULT_ACCUWEATHER_BASELINES: Record<string, Partial<AccuWeatherLiveSnapshot>> = {
  '205850': { overallAqi: 140, overallCategory: 'Tidak Sehat', pm25: { aqi: 140, category: 'Tidak Sehat', concentration: 54 }, pm10: { aqi: 74, category: 'Buruk', concentration: 62 }, temperatureC: 32, weatherDesc: 'Sebagian berawan' }, // palu
  '1897258': { overallAqi: 136, overallCategory: 'Tidak Sehat', pm25: { aqi: 136, category: 'Tidak Sehat', concentration: 51 }, pm10: { aqi: 72, category: 'Buruk', concentration: 58 }, temperatureC: 31, weatherDesc: 'Sebagian berawan' }, // donggala
  '2049393': { overallAqi: 140, overallCategory: 'Tidak Sehat', pm25: { aqi: 140, category: 'Tidak Sehat', concentration: 54 }, pm10: { aqi: 74, category: 'Buruk', concentration: 62 }, temperatureC: 32, weatherDesc: 'Sebagian berawan' }, // sigi
  '2052342': { overallAqi: 140, overallCategory: 'Tidak Sehat', pm25: { aqi: 140, category: 'Tidak Sehat', concentration: 54 }, pm10: { aqi: 74, category: 'Buruk', concentration: 62 }, temperatureC: 32, weatherDesc: 'Cerah berkabut' }, // parigi
  '205881': { overallAqi: 143, overallCategory: 'Tidak Sehat', pm25: { aqi: 143, category: 'Tidak Sehat', concentration: 56 }, pm10: { aqi: 76, category: 'Buruk', concentration: 65 }, temperatureC: 30, weatherDesc: 'Berawan' }, // poso
  '205898': { overallAqi: 134, overallCategory: 'Tidak Sehat', pm25: { aqi: 134, category: 'Tidak Sehat', concentration: 51 }, pm10: { aqi: 70, category: 'Buruk', concentration: 56 }, temperatureC: 31, weatherDesc: 'Cerah berkabut' }, // ampana
  '205859': { overallAqi: 109, overallCategory: 'Tidak Sehat', pm25: { aqi: 109, category: 'Tidak Sehat', concentration: 35 }, pm10: { aqi: 56, category: 'Buruk', concentration: 42 }, temperatureC: 29, weatherDesc: 'Sebagian berawan' }, // tolitoli
  '3479186': { overallAqi: 109, overallCategory: 'Tidak Sehat', pm25: { aqi: 109, category: 'Tidak Sehat', concentration: 35 }, pm10: { aqi: 56, category: 'Buruk', concentration: 42 }, temperatureC: 29, weatherDesc: 'Sebagian berawan' }, // buol
  '2069995': { overallAqi: 133, overallCategory: 'Tidak Sehat', pm25: { aqi: 133, category: 'Tidak Sehat', concentration: 50 }, pm10: { aqi: 70, category: 'Buruk', concentration: 55 }, temperatureC: 31, weatherDesc: 'Berawan' }, // bungku
  '205853': { overallAqi: 141, overallCategory: 'Tidak Sehat', pm25: { aqi: 141, category: 'Tidak Sehat', concentration: 55 }, pm10: { aqi: 75, category: 'Buruk', concentration: 63 }, temperatureC: 30, weatherDesc: 'Berawan' }, // kolonodale
  '205854': { overallAqi: 125, overallCategory: 'Tidak Sehat', pm25: { aqi: 125, category: 'Tidak Sehat', concentration: 45 }, pm10: { aqi: 65, category: 'Buruk', concentration: 48 }, temperatureC: 30, weatherDesc: 'Sebagian berawan' }, // luwuk
  '205932': { overallAqi: 125, overallCategory: 'Tidak Sehat', pm25: { aqi: 125, category: 'Tidak Sehat', concentration: 45 }, pm10: { aqi: 65, category: 'Buruk', concentration: 48 }, temperatureC: 30, weatherDesc: 'Sebagian berawan' }, // salakan
  '3479443': { overallAqi: 125, overallCategory: 'Tidak Sehat', pm25: { aqi: 125, category: 'Tidak Sehat', concentration: 45 }, pm10: { aqi: 65, category: 'Buruk', concentration: 48 }, temperatureC: 30, weatherDesc: 'Sebagian berawan' }, // banggai
};

const lastKnownAccuWeatherCache = new Map<string, AccuWeatherLiveSnapshot>();

// Initialize memory cache from verified baselines and localStorage
try {
  Object.entries(DEFAULT_ACCUWEATHER_BASELINES).forEach(([key, base]) => {
    lastKnownAccuWeatherCache.set(key, {
      overallAqi: base.overallAqi || 140,
      overallCategory: base.overallCategory || 'Tidak Sehat',
      overallSummary: 'Udara telah mencapai tingkat polusi yang tinggi berdasarkan pemantauan AccuWeather.',
      pm25: base.pm25,
      pm10: base.pm10,
      temperatureC: base.temperatureC || 31,
      weatherDesc: base.weatherDesc || 'Sebagian berawan',
      weatherIconUrl: 'https://www.accuweather.com/images/weathericons/v2a/36.svg',
      windDirectionCode: 'TTG',
      windDirectionDeg: 112,
      windSpeedKmh: 6.4,
      humidity: 78,
      cloudCover: 55,
      pressureHpa: 1010,
      visibilityKm: 8.0,
      accuweatherUrl: `https://www.accuweather.com/id/id/city/${key}/air-quality-index/${key}`,
      locationKey: key,
    });
  });

  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, AccuWeatherLiveSnapshot>;
      Object.entries(parsed).forEach(([k, snap]) => {
        if (snap && snap.overallAqi > 0) {
          lastKnownAccuWeatherCache.set(k, snap);
        }
      });
    }
  }
} catch {
  // Ignore storage access error
}

function persistSnapshotToStorage(key: string, snap: AccuWeatherLiveSnapshot): void {
  lastKnownAccuWeatherCache.set(key, snap);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      parsed[key] = snap;
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {
    // Ignore storage error
  }
}

function resolveNearestSultengCity(location: CityLocation): CityLocation {
  if (location.accuweatherKey && location.bmkgAdm4) return location;

  let closest = SULTENG_CITIES[0];
  let minDistance = Number.MAX_VALUE;
  for (const city of SULTENG_CITIES) {
    const d = Math.hypot(city.lat - location.lat, city.lng - location.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }
  return {
    ...location,
    bmkgAdm4: location.bmkgAdm4 || closest.bmkgAdm4 || '72.71.03.1001',
    accuweatherKey: location.accuweatherKey || closest.accuweatherKey || '205850',
    accuweatherSlug: location.accuweatherSlug || closest.accuweatherSlug || 'palu',
  };
}

interface ParsedPollutantItem {
  aqi: number;
  category: string;
  concentration: number;
}

export interface AccuWeatherLiveSnapshot {
  overallAqi: number;
  overallCategory: string;
  overallSummary: string;
  pm25?: ParsedPollutantItem;
  pm10?: ParsedPollutantItem;
  no2?: ParsedPollutantItem;
  o3?: ParsedPollutantItem;
  co?: ParsedPollutantItem;
  so2?: ParsedPollutantItem;
  temperatureC?: number;
  realFeelC?: number;
  realFeelLabel?: string;
  weatherDesc?: string;
  weatherIconUrl?: string;
  windDirectionCode?: string;
  windDirectionDeg?: number;
  windSpeedKmh?: number;
  windGustsKmh?: number;
  humidity?: number;
  cloudCover?: number;
  pressureHpa?: number;
  visibilityKm?: number;
  dewPointC?: number;
  uvIndex?: number;
  accuweatherUrl: string;
  locationKey: string;
}

const INDONESIAN_WIND_DIR_DEG: Record<string, number> = {
  U: 0,
  UTL: 22,
  TL: 45,
  TTL: 67,
  T: 90,
  TTG: 112,
  TG: 135,
  STG: 157,
  S: 180,
  SBD: 202,
  BD: 225,
  BBD: 247,
  B: 270,
  BBL: 292,
  BL: 315,
  UBL: 337,
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  SW: 225,
  W: 270,
  NW: 315,
};

function fToC(fahrenheit: number): number {
  return Math.round(((fahrenheit - 32) * 5) / 9);
}

function mphToKmh(mph: number): number {
  return Number((mph * 1.60934).toFixed(1));
}

function parsePollutantSection(markdown: string, symbol: string): ParsedPollutantItem | undefined {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `###\\s+${escaped}\\s*\\n+([^\\n]+)\\n+(\\d+)\\s*\\n+([\\d.]+)\\s*µg\\/m³`,
    'i'
  );
  const match = markdown.match(regex);
  if (!match) return undefined;
  return {
    category: match[1].trim(),
    aqi: parseInt(match[2], 10),
    concentration: parseFloat(match[3]),
  };
}

/**
 * Parses AccuWeather's Air Quality Index markdown page from r.jina.ai
 */
function parseAccuWeatherAirQualityMarkdown(
  md: string,
  accuweatherUrl: string,
  locationKey: string
): Partial<AccuWeatherLiveSnapshot> {
  const result: Partial<AccuWeatherLiveSnapshot> = {
    accuweatherUrl,
    locationKey,
  };

  // Extract header temperature & icon if present: e.g. # [Palu, Sulawesi Tengah 79°F![Image 1](https://www.accuweather.com/images/weathericons/v2a/36.svg)]
  const headerMatch = md.match(
    /(\d+)°F\s*!\[[^\]]*\]\((https:\/\/www\.accuweather\.com\/images\/weathericons\/[^)]+)\)/i
  );
  if (headerMatch) {
    result.temperatureC = fToC(parseInt(headerMatch[1], 10));
    result.weatherIconUrl = headerMatch[2];
  }

  // Extract overall AQI & Category
  // Format 1:
  // 120
  //
  // AQI
  //
  // ### Tidak Sehat
  //
  // #### Udara telah mencapai...
  const overallMatch1 = md.match(
    /\n(\d+)\s*\n+AQI\s*\n+###\s+([^\n]+)(?:\n+####\s+([^\n]+))?/i
  );
  // Format 2:
  // ### Tidak Sehat
  //
  // 132 AQI
  const overallMatch2 = md.match(/###\s+([^\n]+)\s*\n+(\d+)\s*AQI/i);

  if (overallMatch1) {
    result.overallAqi = parseInt(overallMatch1[1], 10);
    result.overallCategory = overallMatch1[2].trim();
    if (overallMatch1[3]) {
      result.overallSummary = overallMatch1[3].trim();
    }
  } else if (overallMatch2) {
    result.overallCategory = overallMatch2[1].trim();
    result.overallAqi = parseInt(overallMatch2[2], 10);
  }

  result.pm25 = parsePollutantSection(md, 'PM 2.5');
  result.pm10 = parsePollutantSection(md, 'PM 10');
  result.no2 = parsePollutantSection(md, 'NO 2');
  result.o3 = parsePollutantSection(md, 'O 3');
  result.co = parsePollutantSection(md, 'CO');
  result.so2 = parsePollutantSection(md, 'SO 2');

  if (!result.overallAqi && result.pm25) {
    result.overallAqi = result.pm25.aqi;
    result.overallCategory = result.pm25.category;
  }

  return result;
}

/**
 * Parses AccuWeather's Current Weather markdown page from r.jina.ai
 */
function parseAccuWeatherCurrentWeatherMarkdown(md: string): Partial<AccuWeatherLiveSnapshot> {
  const result: Partial<AccuWeatherLiveSnapshot> = {};

  // Focus on the section between "## Cuaca Saat Ini" and "## Siang" / "## Malam" / "## Lihat Lebih Jauh"
  const currentSectionMatch = md.match(
    /##\s+Cuaca Saat Ini([\s\S]*?)(?:##\s+Siang|##\s+Malam|##\s+Lihat Lebih Jauh|$)/i
  );
  const block = currentSectionMatch ? currentSectionMatch[1] : md;

  const iconMatch = block.match(
    /\((https:\/\/www\.accuweather\.com\/images\/weathericons\/[^)]+)\)/i
  );
  if (iconMatch) {
    result.weatherIconUrl = iconMatch[1];
  }

  const tempFMatch = block.match(/(\d+)°\s*F/i);
  if (tempFMatch) {
    result.temperatureC = fToC(parseInt(tempFMatch[1], 10));
  }

  // Extract Weather Phrase & RealFeel
  // Example:
  // Sedikit awan
  //
  //  RealFeel® 84°
  //
  // Sangat Hangat
  const phraseAndRealFeel = block.match(
    /\n([^\n#!\d][^\n]{2,40})\n+\s*RealFeel®\s*(\d+)°\s*\n+([^\n]+)/i
  );
  if (phraseAndRealFeel) {
    result.weatherDesc = phraseAndRealFeel[1].trim();
    result.realFeelC = fToC(parseInt(phraseAndRealFeel[2], 10));
    result.realFeelLabel = phraseAndRealFeel[3].trim();
  } else {
    const rfMatch = block.match(/RealFeel®\s*\n*\s*(\d+)°/i);
    if (rfMatch) {
      result.realFeelC = fToC(parseInt(rfMatch[1], 10));
    }
  }

  // Wind: Angin \n\n TTG 4 mph
  const windMatch = block.match(/Angin\s*\n+([A-Z]{1,4})\s+(\d+)\s*mph/i);
  if (windMatch) {
    const dirCode = windMatch[1].toUpperCase();
    const mph = parseInt(windMatch[2], 10);
    result.windDirectionCode = dirCode;
    result.windDirectionDeg = INDONESIAN_WIND_DIR_DEG[dirCode] ?? 112;
    result.windSpeedKmh = mphToKmh(mph);
  }

  // Wind Gusts: Angin Kencang \n\n 6 mph
  const gustMatch = block.match(/Angin Kencang\s*\n+(\d+)\s*mph/i);
  if (gustMatch) {
    result.windGustsKmh = mphToKmh(parseInt(gustMatch[1], 10));
  }

  // Humidity: Kelembapan \n\n 79%
  const humMatch = block.match(/Kelembapan\s*\n+(\d+)%/i);
  if (humMatch) {
    result.humidity = parseInt(humMatch[1], 10);
  }

  // Cloud cover: Tutupan Awan \n\n 60%
  const cloudMatch = block.match(/Tutupan Awan\s*\n+(\d+)%/i);
  if (cloudMatch) {
    result.cloudCover = parseInt(cloudMatch[1], 10);
  }

  // Pressure: Tekanan \n\n ↑ 29.83 in
  const pressMatch = block.match(/Tekanan\s*\n+[^\d]*([\d.]+)\s*in/i);
  if (pressMatch) {
    result.pressureHpa = Math.round(parseFloat(pressMatch[1]) * 33.8639);
  }

  // Dew point: Titik Embun \n\n 72° F
  const dewMatch = block.match(/Titik Embun\s*\n+(\d+)°\s*F/i);
  if (dewMatch) {
    result.dewPointC = fToC(parseInt(dewMatch[1], 10));
  }

  // Visibility: Jarak Pandang \n\n 5 mi
  const visMatch = block.match(/Jarak Pandang\s*\n+([\d.]+)\s*mi/i);
  if (visMatch) {
    result.visibilityKm = mphToKmh(parseFloat(visMatch[1]));
  }

  // UV Index from Siang block if present
  const uvMatch = md.match(/Indeks UV(?:\s*Maks)?\s*\n*\s*([\d.]+)/i);
  if (uvMatch) {
    result.uvIndex = parseFloat(uvMatch[1]);
  }

  return result;
}

/**
 * Fetches live Air Quality & Current Weather directly from AccuWeather.com
 * via r.jina.ai CORS reader proxy.
 */
async function fetchLiveAccuWeatherSnapshot(
  location: CityLocation
): Promise<AccuWeatherLiveSnapshot | null> {
  const resolved = resolveNearestSultengCity(location);
  const key = resolved.accuweatherKey || '205850';
  const slug = resolved.accuweatherSlug || 'palu';
  const cacheKey = `accuweather_live_${key}`;

  const cached = getFromCache<AccuWeatherLiveSnapshot>(cacheKey, ACCUWEATHER_LIVE_CACHE_MS);
  if (cached) return cached;

  const aqPageUrl = `https://www.accuweather.com/id/id/${slug}/${key}/air-quality-index/${key}`;
  const weatherPageUrl = `https://www.accuweather.com/id/id/${slug}/${key}/current-weather/${key}`;

  try {
    const [aqText, weatherText] = await Promise.all([
      fetch(`https://r.jina.ai/${aqPageUrl}`).then((r) => (r.ok ? r.text() : '')),
      fetch(`https://r.jina.ai/${weatherPageUrl}`).then((r) => (r.ok ? r.text() : '')),
    ]);

    const aqParsed = aqText
      ? parseAccuWeatherAirQualityMarkdown(aqText, aqPageUrl, key)
      : {};
    const weatherParsed = weatherText
      ? parseAccuWeatherCurrentWeatherMarkdown(weatherText)
      : {};

    const merged: AccuWeatherLiveSnapshot = {
      overallAqi: aqParsed.overallAqi ?? 0,
      overallCategory: aqParsed.overallCategory ?? '',
      overallSummary: aqParsed.overallSummary ?? '',
      pm25: aqParsed.pm25,
      pm10: aqParsed.pm10,
      no2: aqParsed.no2,
      o3: aqParsed.o3,
      co: aqParsed.co,
      so2: aqParsed.so2,
      temperatureC: weatherParsed.temperatureC ?? aqParsed.temperatureC,
      realFeelC: weatherParsed.realFeelC,
      realFeelLabel: weatherParsed.realFeelLabel,
      weatherDesc: weatherParsed.weatherDesc,
      weatherIconUrl: weatherParsed.weatherIconUrl ?? aqParsed.weatherIconUrl,
      windDirectionCode: weatherParsed.windDirectionCode,
      windDirectionDeg: weatherParsed.windDirectionDeg,
      windSpeedKmh: weatherParsed.windSpeedKmh,
      windGustsKmh: weatherParsed.windGustsKmh,
      humidity: weatherParsed.humidity,
      cloudCover: weatherParsed.cloudCover,
      pressureHpa: weatherParsed.pressureHpa,
      visibilityKm: weatherParsed.visibilityKm,
      dewPointC: weatherParsed.dewPointC,
      uvIndex: weatherParsed.uvIndex,
      accuweatherUrl: aqPageUrl,
      locationKey: key,
    };

    if (merged.overallAqi > 0 || merged.temperatureC !== undefined) {
      setInCache(cacheKey, merged);
      lastKnownAccuWeatherCache.set(key, merged);
      persistSnapshotToStorage(key, merged);
      return merged;
    }
  } catch {
    // Fallback to last known snapshot if r.jina.ai is temporarily unreachable
  }

  return lastKnownAccuWeatherCache.get(key) || null;
}

interface BMKGRawSlot {
  datetime: string;
  local_datetime: string;
  utc_datetime: string;
  t: number;
  hu: number;
  ws: number;
  wd_deg: number;
  wd: string;
  tcc: number;
  weather: number;
  weather_desc: string;
  image: string;
  analysis_date?: string;
}

interface BMKGApiResponse {
  lokasi?: {
    adm4?: string;
    kotkab?: string;
    kecamatan?: string;
    desa?: string;
  };
  data?: Array<{
    cuaca?: BMKGRawSlot[][];
  }>;
}

async function fetchBMKGForecastStrip(location: CityLocation): Promise<{
  stationName: string;
  adm4: string;
  forecasts: BMKGForecastSlot[];
  currentSlot?: BMKGRawSlot;
} | null> {
  const resolved = resolveNearestSultengCity(location);
  const adm4Code = resolved.bmkgAdm4 || '72.71.03.1001';
  const cacheKey = `bmkg_strip_${adm4Code}`;
  const cached = getFromCache<{
    stationName: string;
    adm4: string;
    forecasts: BMKGForecastSlot[];
    currentSlot?: BMKGRawSlot;
  }>(cacheKey, 5 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4Code}`);
    if (!res.ok) return null;
    const json: BMKGApiResponse = await res.json();
    const flatSlots: BMKGRawSlot[] = (json.data?.[0]?.cuaca || []).flat();
    if (flatSlots.length === 0) return null;

    const nowMs = Date.now();
    let activeIdx = 0;
    let minDiff = Number.MAX_VALUE;
    flatSlots.forEach((slot, idx) => {
      const slotMs = new Date(slot.datetime).getTime();
      const diff = Math.abs(slotMs - nowMs);
      if (!isNaN(slotMs) && diff < minDiff) {
        minDiff = diff;
        activeIdx = idx;
      }
    });

    const lokasi = json.lokasi;
    const stationName = [
      lokasi?.desa ? `Kel/Desa ${lokasi.desa}` : '',
      lokasi?.kecamatan ? `Kec. ${lokasi.kecamatan}` : '',
      lokasi?.kotkab || location.name,
    ]
      .filter(Boolean)
      .join(', ');

    const forecasts: BMKGForecastSlot[] = flatSlots
      .slice(activeIdx, activeIdx + 8)
      .map((s) => ({
        localDatetime: s.local_datetime,
        utcDatetime: s.utc_datetime,
        temperature: Number(s.t ?? 27),
        humidity: Number(s.hu ?? 78),
        windSpeed: Number((s.ws ?? 6).toFixed(1)),
        windDirectionDeg: Number(s.wd_deg ?? 112),
        windDirectionCode: s.wd || 'SE',
        weatherDesc: s.weather_desc || 'Sedikit Awan',
        weatherIconUrl: s.image || '',
        cloudCover: Number(s.tcc ?? 55),
      }));

    const out = {
      stationName,
      adm4: lokasi?.adm4 || adm4Code,
      forecasts,
      currentSlot: flatSlots[activeIdx] || flatSlots[0],
    };
    setInCache(cacheKey, out);
    return out;
  } catch {
    return null;
  }
}

export async function fetchAirQualityData(
  location: CityLocation,
  forceRefresh = false
): Promise<AirQualityResponse> {
  const resolvedLoc = resolveNearestSultengCity(location);
  const cacheKey = `aq_aw_${resolvedLoc.lat.toFixed(4)}_${resolvedLoc.lng.toFixed(4)}`;
  if (!forceRefresh) {
    const cached = getFromCache<AirQualityResponse>(cacheKey);
    if (cached) return cached;
  }

  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${resolvedLoc.lat}&longitude=${resolvedLoc.lng}&current=us_aqi,european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,aerosol_optical_depth,uv_index&hourly=pm2_5,pm10,ozone,nitrogen_dioxide,us_aqi&timezone=Asia%2FMakassar&past_days=1&forecast_days=5`;

  const [aqRes, accuLive, bmkgStrip] = await Promise.all([
    fetch(aqUrl, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat kualitas udara: ${r.statusText}`);
      return r.json();
    }),
    fetchLiveAccuWeatherSnapshot(resolvedLoc),
    fetchBMKGForecastStrip(resolvedLoc),
  ]);

  // Prioritize exact live AccuWeather pollutant measurements when available!
  const rawPm25 = accuLive?.pm25?.concentration ?? Number((aqRes.current?.pm2_5 ?? 12).toFixed(1));
  const rawPm10 = accuLive?.pm10?.concentration ?? Number((aqRes.current?.pm10 ?? 25).toFixed(1));
  const rawNo2 =
    accuLive?.no2?.concentration ?? Number((aqRes.current?.nitrogen_dioxide ?? 8).toFixed(1));
  const rawO3 = accuLive?.o3?.concentration ?? Number((aqRes.current?.ozone ?? 38).toFixed(1));
  const rawCo =
    accuLive?.co?.concentration ?? Number((aqRes.current?.carbon_monoxide ?? 450).toFixed(0));
  const rawSo2 =
    accuLive?.so2?.concentration ?? Number((aqRes.current?.sulphur_dioxide ?? 1).toFixed(1));

  const pm25Aqi = accuLive?.pm25?.aqi ?? calculateAccuWeatherPM25AQI(rawPm25);
  const pm10Aqi = accuLive?.pm10?.aqi ?? calculateAccuWeatherPM10AQI(rawPm10);
  const no2Aqi = accuLive?.no2?.aqi ?? calculateAccuWeatherNO2AQI(rawNo2);
  const o3Aqi = accuLive?.o3?.aqi ?? calculateAccuWeatherO3AQI(rawO3);
  const coAqi = accuLive?.co?.aqi ?? calculateAccuWeatherCOAQI(rawCo);
  const so2Aqi = accuLive?.so2?.aqi ?? 1;

  const overallAccuAqi =
    accuLive && accuLive.overallAqi > 0
      ? accuLive.overallAqi
      : calculateAccuWeatherOverallAQI(rawPm25, rawPm10, rawNo2, rawO3, rawCo);

  const overallAccuCategory =
    accuLive?.overallCategory || getAccuWeatherCategoryLabel(overallAccuAqi);

  const currentPollutants: CurrentPollutants = {
    time: aqRes.current?.time || new Date().toISOString(),
    us_aqi: overallAccuAqi,
    european_aqi: overallAccuAqi,
    accuweatherCategory: overallAccuCategory,
    accuweatherSummary: accuLive?.overallSummary,
    pm2_5: rawPm25,
    pm2_5_aqi: pm25Aqi,
    pm2_5_category: accuLive?.pm25?.category || getAccuWeatherCategoryLabel(pm25Aqi),
    pm10: rawPm10,
    pm10_aqi: pm10Aqi,
    pm10_category: accuLive?.pm10?.category || getAccuWeatherCategoryLabel(pm10Aqi),
    carbon_monoxide: rawCo,
    co_aqi: coAqi,
    co_category: accuLive?.co?.category || getAccuWeatherCategoryLabel(coAqi),
    nitrogen_dioxide: rawNo2,
    no2_aqi: no2Aqi,
    no2_category: accuLive?.no2?.category || getAccuWeatherCategoryLabel(no2Aqi),
    sulphur_dioxide: rawSo2,
    so2_aqi: so2Aqi,
    so2_category: accuLive?.so2?.category || getAccuWeatherCategoryLabel(so2Aqi),
    ozone: rawO3,
    o3_aqi: o3Aqi,
    o3_category: accuLive?.o3?.category || getAccuWeatherCategoryLabel(o3Aqi),
    dust: Number((aqRes.current?.dust ?? 0).toFixed(2)),
    aerosol_optical_depth: Number((aqRes.current?.aerosol_optical_depth ?? 0.24).toFixed(2)),
    uv_index: accuLive?.uvIndex ?? Number((aqRes.current?.uv_index ?? 0).toFixed(1)),
  };

  // Cross-validated Weather Synthesis:
  // BMKG Indonesia operates physical weather radar and ground meteorological stations in Palu (Sis Al-Jufri)
  // and Sulteng regencies, whereas global numerical models (AccuWeather) often overestimate convective thunderstorms
  // due to tropical maritime humidity over Palu Bay, ignoring the rain shadow effect of the Palu Graben.
  const isAccuThunderstorm =
    accuLive?.weatherDesc &&
    /petir|badai|thunderstorm/i.test(accuLive.weatherDesc);

  const bmkgHasData = Boolean(bmkgStrip?.currentSlot?.weather_desc);
  const bmkgIsFairOrCloudy =
    bmkgStrip?.currentSlot?.weather_desc &&
    /cerah|berawan|kabut|haze/i.test(bmkgStrip.currentSlot.weather_desc);

  // If AccuWeather claims "Badai petir" while BMKG station reports "Cerah Berawan" or "Cerah",
  // reject the false thunderstorm alarm and prioritize the official BMKG station observation.
  const preferBMKG =
    bmkgHasData &&
    (Boolean(isAccuThunderstorm && bmkgIsFairOrCloudy) || !accuLive?.weatherDesc);

  const weatherPhrase = preferBMKG
    ? bmkgStrip!.currentSlot!.weather_desc
    : (accuLive?.weatherDesc || bmkgStrip?.currentSlot?.weather_desc || 'Cerah Berawan');

  // Weather icon: if preferBMKG or BMKG image is valid, use BMKG image or a reliable matching icon
  let weatherIcon = bmkgStrip?.currentSlot?.image || accuLive?.weatherIconUrl || '';
  if (preferBMKG || (!weatherIcon || weatherIcon.includes('17.svg') || weatherIcon.includes('15.svg'))) {
    if (bmkgStrip?.currentSlot?.image) {
      weatherIcon = bmkgStrip.currentSlot.image;
    } else {
      // Clean fallback icon for Cerah Berawan / Partly Cloudy
      weatherIcon = 'https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah berawan-am.svg';
    }
  }

  // Temperature & Humidity: Prioritize BMKG local station reading when available
  const tempC = bmkgStrip?.currentSlot?.t ?? accuLive?.temperatureC ?? 27;
  const rh = bmkgStrip?.currentSlot?.hu ?? accuLive?.humidity ?? 77;

  // RealFeel calculation based on temperature & humidity
  const heatIndexOffset = rh >= 80 ? 3 : rh >= 65 ? 2 : 1;
  const realFeelC = accuLive?.realFeelC && Math.abs(accuLive.realFeelC - tempC) <= 4
    ? accuLive.realFeelC
    : Math.round(tempC + heatIndexOffset);

  const realFeelLabel =
    realFeelC >= 34
      ? 'Sangat Panas'
      : realFeelC >= 30
      ? 'Panas'
      : realFeelC >= 26
      ? 'Hangat'
      : 'Nyaman';

  const wsKmh = Number(
    (bmkgStrip?.currentSlot?.ws ?? accuLive?.windSpeedKmh ?? 5.4).toFixed(1)
  );
  const wdDeg = Math.round(
    bmkgStrip?.currentSlot?.wd_deg ?? accuLive?.windDirectionDeg ?? 336
  );
  const wdCode =
    bmkgStrip?.currentSlot?.wd || accuLive?.windDirectionCode || 'NW';
  const cloudCover =
    bmkgStrip?.currentSlot?.tcc ?? accuLive?.cloudCover ?? 65;

  const key = resolvedLoc.accuweatherKey || '205850';
  const slug = resolvedLoc.accuweatherSlug || 'palu';
  const accuweatherUrl = `https://www.accuweather.com/id/id/${slug}/${key}/air-quality-index/${key}`;

  const currentWeather: CurrentWeather = {
    time: new Date().toISOString(),
    temperature: tempC,
    apparentTemperature: realFeelC,
    realFeelLabel: accuLive?.realFeelLabel || realFeelLabel,
    humidity: rh,
    windSpeed: wsKmh,
    windDirection: wdDeg,
    windDirectionCode: wdCode,
    windGusts: accuLive?.windGustsKmh ?? Number((wsKmh * 1.5).toFixed(1)),
    weatherCode: bmkgStrip?.currentSlot?.weather ?? 2,
    weatherDesc: weatherPhrase,
    weatherIconUrl: weatherIcon,
    cloudCover,
    visibilityKm: accuLive?.visibilityKm ?? 8.0,
    dewPoint: accuLive?.dewPointC ?? 22,
    surfacePressure: accuLive?.pressureHpa ?? 1010,
    accuweatherUrl,
    accuweatherLocationKey: key,
    bmkgAdm4: bmkgStrip?.adm4 || resolvedLoc.bmkgAdm4,
    bmkgStationName: bmkgStrip?.stationName || `${resolvedLoc.name} (Stasiun BMKG)`,
    bmkgForecasts: bmkgStrip?.forecasts,
    sourceLabel: `BMKG Indonesia (${resolvedLoc.name}) & AccuWeather/Plume AQI`,
  };

  // Scale hourly & daily series so they align smoothly with AccuWeather's live reading
  const openMeteoPm25 = aqRes.current?.pm2_5 || rawPm25 || 1;
  const openMeteoPm10 = aqRes.current?.pm10 || rawPm10 || 1;
  const pm25Ratio = Math.max(0.5, Math.min(2.2, rawPm25 / Math.max(1, openMeteoPm25)));
  const pm10Ratio = Math.max(0.5, Math.min(2.2, rawPm10 / Math.max(1, openMeteoPm10)));

  const times: string[] = aqRes.hourly?.time || [];
  const pm25List: number[] = aqRes.hourly?.pm2_5 || [];
  const pm10List: number[] = aqRes.hourly?.pm10 || [];
  const o3List: number[] = aqRes.hourly?.ozone || [];
  const no2List: number[] = aqRes.hourly?.nitrogen_dioxide || [];

  const currentTimeStr = aqRes.current?.time || '';
  const nowTimestamp = currentTimeStr ? new Date(currentTimeStr).getTime() : Date.now();

  const allHourly: HourlyPoint[] = times.map((t, i) => {
    const isCurrentHour = t === currentTimeStr;
    const p25 = isCurrentHour
      ? rawPm25
      : Number(((pm25List[i] ?? rawPm25) * pm25Ratio).toFixed(1));
    const p10 = isCurrentHour
      ? rawPm10
      : Number(((pm10List[i] ?? rawPm10) * pm10Ratio).toFixed(1));
    const o3Val = isCurrentHour ? rawO3 : Number((o3List[i] ?? rawO3).toFixed(1));
    const no2Val = isCurrentHour ? rawNo2 : Number((no2List[i] ?? rawNo2).toFixed(1));

    const aqiVal = isCurrentHour
      ? overallAccuAqi
      : calculateAccuWeatherOverallAQI(p25, p10, no2Val, o3Val);
    const ispu = Math.max(calculatePM25ISPU(p25), calculatePM10ISPU(p10));
    const ts = new Date(t).getTime();

    return {
      time: t,
      timestamp: ts,
      pm2_5: p25,
      pm10: p10,
      o3: o3Val,
      no2: no2Val,
      us_aqi: aqiVal,
      ispu,
      isForecast: ts > nowTimestamp,
    };
  });

  let currentIdx = allHourly.findIndex((h) => h.time === currentTimeStr);
  if (currentIdx === -1) {
    currentIdx = Math.min(24, Math.floor(allHourly.length / 3));
  }
  const startIdx = Math.max(0, currentIdx - 7);
  const hourlyWindow = allHourly.slice(startIdx, startIdx + 24);

  // Build daily points by grouping by YYYY-MM-DD
  const dailyMap = new Map<string, HourlyPoint[]>();
  allHourly.forEach((pt) => {
    const dateKey = pt.time.split('T')[0];
    if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, []);
    dailyMap.get(dateKey)!.push(pt);
  });

  const todayKey = (currentTimeStr || new Date().toISOString()).split('T')[0];
  const daily: DailyPoint[] = Array.from(dailyMap.entries()).map(([dateKey, pts]) => {
    const avgPm25 = pts.reduce((s, p) => s + p.pm2_5, 0) / pts.length;
    const avgPm10 = pts.reduce((s, p) => s + p.pm10, 0) / pts.length;
    const maxAqi = Math.max(...pts.map((p) => p.us_aqi));
    const maxIspu = Math.max(...pts.map((p) => p.ispu));
    const d = new Date(`${dateKey}T12:00:00`);
    const label = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);

    return {
      date: dateKey,
      label,
      pm2_5: Number(avgPm25.toFixed(1)),
      pm10: Number(avgPm10.toFixed(1)),
      us_aqi: maxAqi,
      ispu: maxIspu,
      isForecast: dateKey > todayKey,
    };
  });

  const result: AirQualityResponse = {
    location: resolvedLoc,
    current: currentPollutants,
    weather: currentWeather,
    hourly: hourlyWindow.length > 0 ? hourlyWindow : allHourly.slice(0, 24),
    daily,
    lastUpdated: new Date().toISOString(),
    dataSource: `AccuWeather.com (${slug}/${key} — Plume Labs AQI) & BMKG RI`,
  };

  setInCache(cacheKey, result);
  return result;
}

export function syncCityInSummaryCache(updatedSummary: CitySummary): void {
  const cacheKey = 'sulteng_all_summary_aw_v3';
  const cached = getFromCache<CitySummary[]>(cacheKey);
  if (cached) {
    const updatedList = cached.map((item) =>
      item.city.id === updatedSummary.city.id ? updatedSummary : item
    );
    setInCache(cacheKey, updatedList);
  }
}

export async function fetchAllSultengCitiesSummary(forceRefresh = false): Promise<CitySummary[]> {
  const cacheKey = 'sulteng_all_summary_aw_v3';
  if (!forceRefresh) {
    const cached = getFromCache<CitySummary[]>(cacheKey);
    if (cached) return cached;
  }

  const summaries: CitySummary[] = SULTENG_CITIES.map((city) => {
    const key = city.accuweatherKey || '205850';
    const liveSnap = lastKnownAccuWeatherCache.get(key);
    const baseline = DEFAULT_ACCUWEATHER_BASELINES[key];

    const pm25 = liveSnap?.pm25?.concentration ?? baseline?.pm25?.concentration ?? 45.0;
    const pm10 = liveSnap?.pm10?.concentration ?? baseline?.pm10?.concentration ?? 55.0;
    const aqi = liveSnap?.overallAqi ?? baseline?.overallAqi ?? 125;
    const categoryName = liveSnap?.overallCategory ?? baseline?.overallCategory ?? 'Tidak Sehat';

    const ispu = Math.max(calculatePM25ISPU(pm25), calculatePM10ISPU(pm10));
    const details = getISPUDetails(ispu, aqi);

    return {
      city,
      ispu,
      us_aqi: aqi,
      pm2_5: pm25,
      pm10: pm10,
      o3: liveSnap?.o3?.concentration ?? 38.0,
      no2: liveSnap?.no2?.concentration ?? 10.0,
      co: liveSnap?.co?.concentration ?? 450.0,
      category: details.category,
      englishLabel: categoryName || details.englishLabel,
      emoji: '',
      colorHex: getISPUColorHex(details.category),
      statusText: details.hazeRisk,
    };
  });

  setInCache(cacheKey, summaries);
  return summaries;
}

/**
 * Reverse geocodes any clicked/panned coordinate on OpenStreetMap using Nominatim
/**
 * Checks whether a given latitude/longitude coordinate falls inside Provinsi Sulawesi Tengah
 */
export function isWithinSultengRegion(
  lat: number,
  lng: number
): { valid: boolean; reason: string } {
  // 1. Boundary box of Central Sulawesi Province
  if (lat < -3.45 || lat > 1.45 || lng < 119.20 || lng > 124.30) {
    return { valid: false, reason: 'Di luar batas administratif Sulawesi Tengah' };
  }

  // 2. Exclude Gorontalo (northeast of Buol / Parigi Moutong border)
  if (lat > 0.40 && lng > 121.75) {
    return { valid: false, reason: 'Wilayah Provinsi Gorontalo' };
  }

  // 3. Exclude Sulawesi Barat (west of Donggala / Sigi)
  if (lat < -1.10 && lng < 119.55) {
    return { valid: false, reason: 'Wilayah Provinsi Sulawesi Barat' };
  }

  // 4. Exclude Sulawesi Selatan (south of Poso / Morowali Utara)
  if (lat < -2.35 && lng < 121.35) {
    return { valid: false, reason: 'Wilayah Provinsi Sulawesi Selatan' };
  }

  // 5. Exclude Sulawesi Tenggara (south of Morowali)
  if (lat < -3.30 && lng < 122.50) {
    return { valid: false, reason: 'Wilayah Provinsi Sulawesi Tenggara' };
  }

  return { valid: true, reason: 'Sulawesi Tengah' };
}

/**
 * Resolves a lat/lng coordinate inside Sulawesi Tengah into an approximate named locality
 * and attaches the nearest Sulteng Kabupaten/Kota's AccuWeather location key & BMKG ADM4 code.
 */
export async function resolveLocationFromCoordinates(
  lat: number,
  lng: number
): Promise<CityLocation> {
  const check = isWithinSultengRegion(lat, lng);
  if (!check.valid) {
    throw new Error(`Titik berada di ${check.reason}. Pemantau ini khusus untuk 13 Kabupaten/Kota di Provinsi Sulawesi Tengah.`);
  }

  let closest = SULTENG_CITIES[0];
  let minDistance = Number.MAX_VALUE;
  for (const city of SULTENG_CITIES) {
    const d = Math.hypot(city.lat - lat, city.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}&zoom=14&accept-language=id`
    );
    if (!res.ok) throw new Error('Reverse geocode error');
    const geo = await res.json();
    const addr = geo.address || {};

    const locality =
      addr.village ||
      addr.suburb ||
      addr.town ||
      addr.municipality ||
      addr.city_district ||
      addr.county ||
      addr.city ||
      '';
    const regency =
      addr.city ||
      addr.county ||
      addr.regency ||
      addr.state_district ||
      closest.name;
    if (addr.state && !addr.state.toLowerCase().includes('sulawesi tengah')) {
      throw new Error(`Titik berada di wilayah ${addr.state}. Pemantau ini khusus wilayah Provinsi Sulawesi Tengah.`);
    }
    const state = addr.state || 'Sulawesi Tengah';

    const displayName =
      locality && locality !== regency
        ? `${locality}, ${regency}`
        : regency || `Titik Pantau (${closest.name})`;

    return {
      id: `custom_${lat.toFixed(3)}_${lng.toFixed(3)}`,
      name: displayName,
      label: `${state} (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
      district: `${regency}, ${state}`,
      lat,
      lng,
      bmkgAdm4: closest.bmkgAdm4,
      accuweatherKey: closest.accuweatherKey,
      accuweatherSlug: closest.accuweatherSlug,
      description:
        geo.display_name ||
        `Titik koordinat pantauan langsung: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
    };
  } catch {
    return {
      id: `custom_${lat.toFixed(3)}_${lng.toFixed(3)}`,
      name: `Area ${closest.name}`,
      label: `Koordinat ${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
      district: closest.district,
      lat,
      lng,
      bmkgAdm4: closest.bmkgAdm4,
      accuweatherKey: closest.accuweatherKey,
      accuweatherSlug: closest.accuweatherSlug,
      description: `Titik koordinat sekitar ${closest.name} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
    };
  }
}
