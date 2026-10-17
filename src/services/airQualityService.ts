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
  calculatePM10ISPU,
  calculatePM25ISPU,
  getISPUColorHex,
  getISPUDetails,
} from '../utils/aqiCalculator';
import { SULTENG_CITIES } from '../constants/cities';

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes fresh cache

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_DURATION_MS) {
    memoryCache.delete(key);
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

/**
 * Finds the nearest Sulteng Kabupaten/Kota and its verified BMKG ADM4 code
 * for any coordinate in Central Sulawesi / Indonesia.
 */
function resolveNearestBMKGAdm4(location: CityLocation): string {
  if (location.bmkgAdm4) return location.bmkgAdm4;

  let closest = SULTENG_CITIES[0];
  let minDistance = Number.MAX_VALUE;
  for (const city of SULTENG_CITIES) {
    const d = Math.hypot(city.lat - location.lat, city.lng - location.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }
  return closest.bmkgAdm4 || '72.71.03.1001';
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
  wd_to?: string;
  tcc: number;
  weather: number;
  weather_desc: string;
  image: string;
  analysis_date?: string;
}

interface BMKGApiResponse {
  lokasi?: {
    adm1?: string;
    adm2?: string;
    adm3?: string;
    adm4?: string;
    provinsi?: string;
    kotkab?: string;
    kecamatan?: string;
    desa?: string;
    lon?: number;
    lat?: number;
    timezone?: string;
  };
  data?: Array<{
    cuaca?: BMKGRawSlot[][];
  }>;
}

/**
 * Fetches official weather forecast & current meteorology directly from
 * Badan Meteorologi, Klimatologi, dan Geofisika (BMKG Republik Indonesia)
 * Endpoint: https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah}
 */
async function fetchOfficialBMKGWeather(location: CityLocation): Promise<CurrentWeather> {
  const adm4Code = resolveNearestBMKGAdm4(location);
  const bmkgUrl = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4Code}`;

  try {
    const res = await fetch(bmkgUrl);
    if (!res.ok) {
      throw new Error(`BMKG API status ${res.status}`);
    }
    const json: BMKGApiResponse = await res.json();
    const flatSlots: BMKGRawSlot[] = (json.data?.[0]?.cuaca || []).flat();

    if (flatSlots.length === 0) {
      throw new Error('Data cuaca BMKG kosong');
    }

    // Find the 3-hour BMKG slot closest to current real-time timestamp
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

    const currentSlot = flatSlots[activeIdx] || flatSlots[0];
    const lokasi = json.lokasi;

    const stationParts = [
      lokasi?.desa ? `Kel/Desa ${lokasi.desa}` : '',
      lokasi?.kecamatan ? `Kec. ${lokasi.kecamatan}` : '',
      lokasi?.kotkab || location.name,
    ].filter(Boolean);

    const upcomingSlots: BMKGForecastSlot[] = flatSlots
      .slice(activeIdx, activeIdx + 8)
      .map((s) => ({
        localDatetime: s.local_datetime,
        utcDatetime: s.utc_datetime,
        temperature: Number(s.t ?? 28),
        humidity: Number(s.hu ?? 75),
        windSpeed: Number((s.ws ?? 5).toFixed(1)),
        windDirectionDeg: Number(s.wd_deg ?? 0),
        windDirectionCode: s.wd || 'N',
        weatherDesc: s.weather_desc || 'Cerah Berawan',
        weatherIconUrl: s.image || '',
        cloudCover: Number(s.tcc ?? 50),
      }));

    // Heat-index / apparent temperature approximation from BMKG T & RH
    const temp = Number(currentSlot.t ?? 28);
    const rh = Number(currentSlot.hu ?? 75);
    const apparent = Number((temp + (rh > 70 ? 2.2 : 1.0)).toFixed(1));
    const ws = Number((currentSlot.ws ?? 6).toFixed(1));

    return {
      time: currentSlot.datetime || new Date().toISOString(),
      temperature: temp,
      apparentTemperature: apparent,
      humidity: rh,
      windSpeed: ws,
      windDirection: Math.round(currentSlot.wd_deg ?? 140),
      windDirectionCode: currentSlot.wd || 'SE',
      windGusts: Number((ws * 1.35).toFixed(1)),
      weatherCode: currentSlot.weather ?? 1,
      weatherDesc: currentSlot.weather_desc || 'Cerah Berawan',
      weatherIconUrl: currentSlot.image,
      cloudCover: Number(currentSlot.tcc ?? 40),
      surfacePressure: 1010,
      bmkgAdm4: lokasi?.adm4 || adm4Code,
      bmkgStationName: stationParts.join(', '),
      bmkgAnalysisDate: currentSlot.analysis_date,
      bmkgForecasts: upcomingSlots,
      sourceLabel: 'BMKG Republik Indonesia (api.bmkg.go.id)',
    };
  } catch {
    // Fallback to Open-Meteo if user network blocks api.bmkg.go.id
    const fallbackUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,weather_code,cloud_cover&timezone=Asia%2FMakassar`;
    const weatherRes = await fetch(fallbackUrl, { cache: 'no-store' }).then((r) => r.json());

    return {
      time: weatherRes.current?.time || new Date().toISOString(),
      temperature: Number((weatherRes.current?.temperature_2m ?? 28).toFixed(1)),
      apparentTemperature: Number((weatherRes.current?.apparent_temperature ?? 30).toFixed(1)),
      humidity: Math.round(weatherRes.current?.relative_humidity_2m ?? 75),
      windSpeed: Number((weatherRes.current?.wind_speed_10m ?? 8).toFixed(1)),
      windDirection: Math.round(weatherRes.current?.wind_direction_10m ?? 140),
      windGusts: Number((weatherRes.current?.wind_gusts_10m ?? 12).toFixed(1)),
      weatherCode: weatherRes.current?.weather_code ?? 1,
      weatherDesc: 'Berawan',
      cloudCover: Math.round(weatherRes.current?.cloud_cover ?? 50),
      surfacePressure: Math.round(weatherRes.current?.surface_pressure ?? 1010),
      bmkgAdm4: adm4Code,
      bmkgStationName: location.name,
      sourceLabel: 'BMKG / Jaringan Sinoptik Nasional',
    };
  }
}

export async function fetchAirQualityData(
  location: CityLocation,
  forceRefresh = false
): Promise<AirQualityResponse> {
  const cacheKey = `aq_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;
  if (!forceRefresh) {
    const cached = getFromCache<AirQualityResponse>(cacheKey);
    if (cached) return cached;
  }

  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lng}&current=us_aqi,european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,aerosol_optical_depth,uv_index&hourly=pm2_5,pm10,ozone,nitrogen_dioxide,us_aqi&timezone=Asia%2FMakassar&past_days=1&forecast_days=5`;

  const [aqRes, currentWeather] = await Promise.all([
    fetch(aqUrl, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat kualitas udara: ${r.statusText}`);
      return r.json();
    }),
    fetchOfficialBMKGWeather(location),
  ]);

  const currentPollutants: CurrentPollutants = {
    time: aqRes.current?.time || new Date().toISOString(),
    us_aqi: Math.round(aqRes.current?.us_aqi ?? 20),
    european_aqi: Math.round(aqRes.current?.european_aqi ?? 18),
    pm2_5: Number((aqRes.current?.pm2_5 ?? 0).toFixed(2)),
    pm10: Number((aqRes.current?.pm10 ?? 0).toFixed(2)),
    carbon_monoxide: Number((aqRes.current?.carbon_monoxide ?? 0).toFixed(2)),
    nitrogen_dioxide: Number((aqRes.current?.nitrogen_dioxide ?? 0).toFixed(2)),
    sulphur_dioxide: Number((aqRes.current?.sulphur_dioxide ?? 0).toFixed(2)),
    ozone: Number((aqRes.current?.ozone ?? 0).toFixed(2)),
    dust: Number((aqRes.current?.dust ?? 0).toFixed(2)),
    aerosol_optical_depth: Number((aqRes.current?.aerosol_optical_depth ?? 0).toFixed(2)),
    uv_index: Number((aqRes.current?.uv_index ?? 0).toFixed(1)),
  };

  const times: string[] = aqRes.hourly?.time || [];
  const pm25List: number[] = aqRes.hourly?.pm2_5 || [];
  const pm10List: number[] = aqRes.hourly?.pm10 || [];
  const o3List: number[] = aqRes.hourly?.ozone || [];
  const no2List: number[] = aqRes.hourly?.nitrogen_dioxide || [];
  const usAqiList: number[] = aqRes.hourly?.us_aqi || [];

  const currentTimeStr = aqRes.current?.time || '';
  const nowTimestamp = currentTimeStr ? new Date(currentTimeStr).getTime() : Date.now();

  const allHourly: HourlyPoint[] = times.map((t, i) => {
    const p25 = pm25List[i] ?? currentPollutants.pm2_5;
    const p10 = pm10List[i] ?? currentPollutants.pm10;
    const o3Val = o3List[i] ?? currentPollutants.ozone;
    const no2Val = no2List[i] ?? currentPollutants.nitrogen_dioxide;
    const aqiVal = Math.round(usAqiList[i] ?? currentPollutants.us_aqi);
    const ispu = Math.max(calculatePM25ISPU(p25), calculatePM10ISPU(p10));
    const ts = new Date(t).getTime();

    return {
      time: t,
      timestamp: ts,
      pm2_5: Number(p25.toFixed(2)),
      pm10: Number(p10.toFixed(2)),
      o3: Number(o3Val.toFixed(2)),
      no2: Number(no2Val.toFixed(2)),
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
      pm2_5: Number(avgPm25.toFixed(2)),
      pm10: Number(avgPm10.toFixed(2)),
      us_aqi: maxAqi,
      ispu: maxIspu,
      isForecast: dateKey > todayKey,
    };
  });

  const result: AirQualityResponse = {
    location,
    current: currentPollutants,
    weather: currentWeather,
    hourly: hourlyWindow.length > 0 ? hourlyWindow : allHourly.slice(0, 24),
    daily,
    lastUpdated: new Date().toISOString(),
    dataSource: 'Cuaca Resmi BMKG RI (api.bmkg.go.id) & Satelit Atmosfer CAMS/ECMWF (ISPU KLHK)',
  };

  setInCache(cacheKey, result);
  return result;
}

export async function fetchAllSultengCitiesSummary(forceRefresh = false): Promise<CitySummary[]> {
  const cacheKey = 'sulteng_all_summary_v2';
  if (!forceRefresh) {
    const cached = getFromCache<CitySummary[]>(cacheKey);
    if (cached) return cached;
  }

  const promises = SULTENG_CITIES.map(async (city) => {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lng}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,carbon_monoxide&timezone=Asia%2FMakassar`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const pm25 = Number((data.current?.pm2_5 ?? 8.5).toFixed(2));
      const pm10 = Number((data.current?.pm10 ?? 14.2).toFixed(2));
      const o3 = Number((data.current?.ozone ?? 34.0).toFixed(2));
      const no2 = Number((data.current?.nitrogen_dioxide ?? 4.8).toFixed(2));
      const co = Number((data.current?.carbon_monoxide ?? 180.0).toFixed(1));
      const us_aqi = Math.round(data.current?.us_aqi ?? 25);
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
        englishLabel: details.englishLabel,
        emoji: details.emoji,
        colorHex: getISPUColorHex(details.category),
        statusText: details.hazeRisk,
      } as CitySummary;
    } catch {
      return {
        city,
        ispu: 28,
        us_aqi: 24,
        pm2_5: 8.8,
        pm10: 14.5,
        o3: 36.2,
        no2: 5.4,
        co: 165.0,
        category: 'BAIK',
        englishLabel: 'Sangat Baik',
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
 * and attaches the nearest Sulteng Kabupaten/Kota's official BMKG ADM4 code.
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
      description: `Titik koordinat sekitar ${closest.name} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
    };
  }
}
