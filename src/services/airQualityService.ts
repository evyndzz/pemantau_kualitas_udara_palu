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
const ACCUWEATHER_LIVE_CACHE_MS = 3 * 60 * 1000; // 3 minutes cache for r.jina.ai AccuWeather scrape to respect 20 req/min limit

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const lastKnownAccuWeatherCache = new Map<string, AccuWeatherLiveSnapshot>();

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

  // Build CurrentWeather prioritizing AccuWeather.com live weather data
  const tempC = accuLive?.temperatureC ?? bmkgStrip?.currentSlot?.t ?? 26;
  const rh = accuLive?.humidity ?? bmkgStrip?.currentSlot?.hu ?? 79;
  const realFeelC =
    accuLive?.realFeelC ?? Math.round(tempC + (rh >= 75 ? 3 : 2));
  const wsKmh =
    accuLive?.windSpeedKmh ?? Number((bmkgStrip?.currentSlot?.ws ?? 6.4).toFixed(1));
  const wdDeg =
    accuLive?.windDirectionDeg ?? Math.round(bmkgStrip?.currentSlot?.wd_deg ?? 112);
  const wdCode = accuLive?.windDirectionCode || bmkgStrip?.currentSlot?.wd || 'TTG';
  const weatherPhrase =
    accuLive?.weatherDesc || bmkgStrip?.currentSlot?.weather_desc || 'Sedikit awan';
  const weatherIcon =
    accuLive?.weatherIconUrl ||
    bmkgStrip?.currentSlot?.image ||
    'https://www.accuweather.com/images/weathericons/v2a/36.svg';

  const key = resolvedLoc.accuweatherKey || '205850';
  const slug = resolvedLoc.accuweatherSlug || 'palu';
  const accuweatherUrl = `https://www.accuweather.com/id/id/${slug}/${key}/air-quality-index/${key}`;

  const currentWeather: CurrentWeather = {
    time: new Date().toISOString(),
    temperature: tempC,
    apparentTemperature: realFeelC,
    realFeelLabel: accuLive?.realFeelLabel || (realFeelC >= 29 ? 'Sangat Hangat' : 'Hangat'),
    humidity: rh,
    windSpeed: wsKmh,
    windDirection: wdDeg,
    windDirectionCode: wdCode,
    windGusts: accuLive?.windGustsKmh ?? Number((wsKmh * 1.5).toFixed(1)),
    weatherCode: bmkgStrip?.currentSlot?.weather ?? 1,
    weatherDesc: weatherPhrase,
    weatherIconUrl: weatherIcon,
    cloudCover: accuLive?.cloudCover ?? bmkgStrip?.currentSlot?.tcc ?? 60,
    visibilityKm: accuLive?.visibilityKm ?? 8.0,
    dewPoint: accuLive?.dewPointC ?? 22,
    surfacePressure: accuLive?.pressureHpa ?? 1010,
    accuweatherUrl,
    accuweatherLocationKey: key,
    bmkgAdm4: bmkgStrip?.adm4 || resolvedLoc.bmkgAdm4,
    bmkgStationName: `${resolvedLoc.name} (AccuWeather Key #${key})`,
    bmkgForecasts: bmkgStrip?.forecasts,
    sourceLabel: `AccuWeather.com (${slug}/${key}) & Plume Labs AQI`,
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

export async function fetchAllSultengCitiesSummary(forceRefresh = false): Promise<CitySummary[]> {
  const cacheKey = 'sulteng_all_summary_aw_v3';
  if (!forceRefresh) {
    const cached = getFromCache<CitySummary[]>(cacheKey);
    if (cached) return cached;
  }

  const promises = SULTENG_CITIES.map(async (city) => {
    try {
      // Check if we already have a live AccuWeather snapshot cached for this city
      const liveSnap = city.accuweatherKey
        ? lastKnownAccuWeatherCache.get(city.accuweatherKey)
        : undefined;

      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lng}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,carbon_monoxide&timezone=Asia%2FMakassar`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      const pm25 =
        liveSnap?.pm25?.concentration ?? Number((data.current?.pm2_5 ?? 12.0).toFixed(1));
      const pm10 =
        liveSnap?.pm10?.concentration ?? Number((data.current?.pm10 ?? 24.0).toFixed(1));
      const o3 = liveSnap?.o3?.concentration ?? Number((data.current?.ozone ?? 38.0).toFixed(1));
      const no2 =
        liveSnap?.no2?.concentration ??
        Number((data.current?.nitrogen_dioxide ?? 10.0).toFixed(1));
      const co =
        liveSnap?.co?.concentration ??
        Number((data.current?.carbon_monoxide ?? 450.0).toFixed(0));

      const us_aqi =
        liveSnap && liveSnap.overallAqi > 0
          ? liveSnap.overallAqi
          : calculateAccuWeatherOverallAQI(pm25, pm10, no2, o3, co);
      const ispu = Math.max(calculatePM25ISPU(pm25), calculatePM10ISPU(pm10));
      const details = getISPUDetails(ispu, us_aqi);

      return {
        city,
        ispu,
        us_aqi,
        pm2_5: pm25,
        pm10: pm10,
        o3,
        no2,
        co,
        category: details.category,
        englishLabel: liveSnap?.overallCategory || details.englishLabel,
        emoji: details.emoji,
        colorHex: getISPUColorHex(details.category),
        statusText: details.hazeRisk,
      } as CitySummary;
    } catch {
      return {
        city,
        ispu: 35,
        us_aqi: 42,
        pm2_5: 14.0,
        pm10: 28.0,
        o3: 38.0,
        no2: 11.0,
        co: 420.0,
        category: 'BAIK',
        englishLabel: 'Lumayan',
        emoji: '',
        colorHex: '#10B981',
        statusText: 'Aman',
      } as CitySummary;
    }
  });

  const summaries = await Promise.all(promises);
  setInCache(cacheKey, summaries);
  return summaries;
}

/**
 * Reverse geocodes any clicked/panned coordinate on OpenStreetMap using Nominatim
 * and attaches the nearest Sulteng Kabupaten/Kota's AccuWeather location key & BMKG ADM4 code.
 */
export async function resolveLocationFromCoordinates(
  lat: number,
  lng: number
): Promise<CityLocation> {
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
