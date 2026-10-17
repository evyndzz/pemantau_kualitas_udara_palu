export interface CityLocation {
  id: string;
  name: string;
  label: string;
  district: string;
  lat: number;
  lng: number;
  description: string;
  isProvincialCapital?: boolean;
}

export interface CurrentPollutants {
  time: string;
  us_aqi: number;
  pm2_5: number;
  pm10: number;
  carbon_monoxide: number; // CO
  nitrogen_dioxide: number; // NO2
  sulphur_dioxide: number; // SO2
  ozone: number; // O3
  dust?: number;
  aerosol_optical_depth?: number;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
}

export interface HourlyPoint {
  time: string;
  timestamp: number;
  pm2_5: number;
  pm10: number;
  us_aqi: number;
  ispu: number;
}

export interface AirQualityResponse {
  location: CityLocation;
  current: CurrentPollutants;
  weather: CurrentWeather;
  hourly: HourlyPoint[];
  lastUpdated: string;
}

export type ISPUCategory = 'BAIK' | 'SEDANG' | 'TIDAK SEHAT' | 'SANGAT TIDAK SEHAT' | 'BERBAHAYA';

export interface ISPUInfo {
  score: number;
  category: ISPUCategory;
  colorName: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
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
  pm2_5: number;
  category: ISPUCategory;
  colorHex: string;
  statusText: string;
}
