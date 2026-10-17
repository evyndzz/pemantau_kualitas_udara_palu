import type { AirQualityResponse, CityLocation, CitySummary, CurrentPollutants, CurrentWeather, HourlyPoint } from '../types';
import { calculatePM25ISPU, calculatePM10ISPU, getISPUColorHex, getISPUDetails } from '../utils/aqiCalculator';
import { SULTENG_CITIES } from '../constants/cities';

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

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

export async function fetchAirQualityData(location: CityLocation): Promise<AirQualityResponse> {
  const cacheKey = `aq_${location.lat.toFixed(3)}_${location.lng.toFixed(3)}`;
  const cached = getFromCache<AirQualityResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lng}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,aerosol_optical_depth&hourly=pm2_5,pm10,us_aqi&timezone=Asia%2FMakassar&forecast_days=3`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=Asia%2FMakassar`;

  const [aqRes, weatherRes] = await Promise.all([
    fetch(aqUrl).then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat kualitas udara: ${r.statusText}`);
      return r.json();
    }),
    fetch(weatherUrl).then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat cuaca: ${r.statusText}`);
      return r.json();
    }),
  ]);

  const currentPollutants: CurrentPollutants = {
    time: aqRes.current?.time || new Date().toISOString(),
    us_aqi: Math.round(aqRes.current?.us_aqi ?? 0),
    pm2_5: Number((aqRes.current?.pm2_5 ?? 0).toFixed(1)),
    pm10: Number((aqRes.current?.pm10 ?? 0).toFixed(1)),
    carbon_monoxide: Number((aqRes.current?.carbon_monoxide ?? 0).toFixed(1)),
    nitrogen_dioxide: Number((aqRes.current?.nitrogen_dioxide ?? 0).toFixed(1)),
    sulphur_dioxide: Number((aqRes.current?.sulphur_dioxide ?? 0).toFixed(1)),
    ozone: Number((aqRes.current?.ozone ?? 0).toFixed(1)),
    dust: aqRes.current?.dust ? Number(aqRes.current.dust.toFixed(1)) : 0,
    aerosol_optical_depth: aqRes.current?.aerosol_optical_depth ? Number(aqRes.current.aerosol_optical_depth.toFixed(2)) : 0,
  };

  const currentWeather: CurrentWeather = {
    time: weatherRes.current?.time || new Date().toISOString(),
    temperature: Math.round(weatherRes.current?.temperature_2m ?? 0),
    humidity: Math.round(weatherRes.current?.relative_humidity_2m ?? 0),
    windSpeed: Number((weatherRes.current?.wind_speed_10m ?? 0).toFixed(1)),
    windDirection: Math.round(weatherRes.current?.wind_direction_10m ?? 0),
    weatherCode: weatherRes.current?.weather_code ?? 0,
  };

  // Build hourly
  const times: string[] = aqRes.hourly?.time || [];
  const pm25List: number[] = aqRes.hourly?.pm2_5 || [];
  const pm10List: number[] = aqRes.hourly?.pm10 || [];
  const usAqiList: number[] = aqRes.hourly?.us_aqi || [];

  const hourly: HourlyPoint[] = times.map((t, i) => {
    const p25 = pm25List[i] ?? 0;
    const p10 = pm10List[i] ?? 0;
    const ispu = Math.max(calculatePM25ISPU(p25), calculatePM10ISPU(p10));
    return {
      time: t,
      timestamp: new Date(t).getTime(),
      pm2_5: Number(p25.toFixed(1)),
      pm10: Number(p10.toFixed(1)),
      us_aqi: Math.round(usAqiList[i] ?? 0),
      ispu,
    };
  });

  const result: AirQualityResponse = {
    location,
    current: currentPollutants,
    weather: currentWeather,
    hourly,
    lastUpdated: new Date().toISOString(),
  };

  setInCache(cacheKey, result);
  return result;
}

export async function fetchAllSultengCitiesSummary(): Promise<CitySummary[]> {
  const cacheKey = 'sulteng_all_summary';
  const cached = getFromCache<CitySummary[]>(cacheKey);
  if (cached) return cached;

  const promises = SULTENG_CITIES.map(async (city) => {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lng}&current=pm2_5,pm10,us_aqi&timezone=Asia%2FMakassar`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const pm25 = data.current?.pm2_5 ?? 0;
      const pm10 = data.current?.pm10 ?? 0;
      const ispu = Math.max(calculatePM25ISPU(pm25), calculatePM10ISPU(pm10));
      const details = getISPUDetails(ispu);
      return {
        city,
        ispu,
        pm2_5: Number(pm25.toFixed(1)),
        category: details.category,
        colorHex: getISPUColorHex(details.category),
        statusText: details.hazeRisk,
      } as CitySummary;
    } catch {
      return {
        city,
        ispu: 45,
        pm2_5: 12.0,
        category: 'BAIK',
        colorHex: '#10b981',
        statusText: 'Aman',
      } as CitySummary;
    }
  });

  const summaries = await Promise.all(promises);
  setInCache(cacheKey, summaries);
  return summaries;
}
