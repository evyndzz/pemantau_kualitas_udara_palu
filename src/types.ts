export interface CityLocation {
  id: string;
  name: string;
  label: string;
  district: string;
  lat: number;
  lng: number;
  description: string;
  bmkgAdm4?: string;
  isProvincialCapital?: boolean;
}

export interface CurrentPollutants {
  time: string;
  us_aqi: number;
  european_aqi: number;
  pm2_5: number;
  pm10: number;
  carbon_monoxide: number; // CO (µg/m³)
  nitrogen_dioxide: number; // NO2 (µg/m³)
  sulphur_dioxide: number; // SO2 (µg/m³)
  ozone: number; // O3 (µg/m³)
  dust: number;
  aerosol_optical_depth: number;
  uv_index: number;
}

export interface BMKGForecastSlot {
  localDatetime: string;
  utcDatetime: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirectionDeg: number;
  windDirectionCode: string;
  weatherDesc: string;
  weatherIconUrl: string;
  cloudCover: number;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windDirectionCode?: string;
  windGusts: number;
  weatherCode: number;
  weatherDesc: string;
  weatherIconUrl?: string;
  cloudCover?: number;
  surfacePressure: number;
  bmkgAdm4?: string;
  bmkgStationName?: string;
  bmkgAnalysisDate?: string;
  bmkgForecasts?: BMKGForecastSlot[];
  sourceLabel: string;
}

export interface HourlyPoint {
  time: string;
  timestamp: number;
  pm2_5: number;
  pm10: number;
  o3: number;
  no2: number;
  us_aqi: number;
  ispu: number;
  isForecast: boolean;
}

export interface DailyPoint {
  date: string;
  label: string;
  pm2_5: number;
  pm10: number;
  us_aqi: number;
  ispu: number;
  isForecast: boolean;
}

export interface AirQualityResponse {
  location: CityLocation;
  current: CurrentPollutants;
  weather: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  lastUpdated: string;
  dataSource: string;
}

export type ISPUCategory = 'BAIK' | 'SEDANG' | 'TIDAK SEHAT' | 'SANGAT TIDAK SEHAT' | 'BERBAHAYA';

export interface ISPUInfo {
  score: number;
  usAqiScore: number;
  category: ISPUCategory;
  englishLabel: string;
  emoji: string;
  colorName: string;
  colorHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  pillClass: string;
  ringClass: string;
  hazeRisk: 'Aman' | 'Waspada Asap' | 'Siaga Asap' | 'Darurat Asap';
  description: string;
  actionAdvice: string;
  maskRecommendation: string;
  outdoorAdvice: string;
  vulnerableGroupAdvice: string;
}

export interface CitySummary {
  city: CityLocation;
  ispu: number;
  us_aqi: number;
  pm2_5: number;
  pm10: number;
  o3: number;
  no2: number;
  co: number;
  category: ISPUCategory;
  englishLabel: string;
  emoji: string;
  colorHex: string;
  statusText: string;
}

export type NavTab = 'home' | 'air-maps' | 'newsroom' | 'breathe-care';

export interface PollutantVisibility {
  pm2_5: boolean;
  pm10: boolean;
  o3: boolean;
  no2: boolean;
  co: boolean;
  aqiColorArea: boolean;
}
