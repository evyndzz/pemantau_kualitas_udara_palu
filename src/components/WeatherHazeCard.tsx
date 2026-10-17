import React from 'react';
import { Compass, Droplets, Gauge, Navigation, Thermometer, Wind } from 'lucide-react';
import type { CurrentWeather } from '../types';
import { getWindDirectionLabel } from '../utils/aqiCalculator';

interface WeatherHazeCardProps {
  weather: CurrentWeather;
  cityName: string;
}

export const WeatherHazeCard: React.FC<WeatherHazeCardProps> = ({ weather, cityName }) => {
  const dirLabel = getWindDirectionLabel(weather.windDirection);

  const isDry = weather.humidity < 60;
  const isHot = weather.temperature >= 32;
  const isWindy = weather.windSpeed >= 15;

  let fireRisk = 'Rendah (Aman)';
  let fireRiskClass = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
  let fireDesc =
    'Kelembapan udara cukup tinggi dan suhu terkendali, potensi rambatan api permukaan relatif lambat.';

  if (isDry && isHot && isWindy) {
    fireRisk = 'Sangat Tinggi (Bahaya Karhutla)';
    fireRiskClass = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800';
    fireDesc =
      'Cuaca terik, kering, dan berangin kencang. Titik api karhutla dapat menjalar sangat cepat dan membawa kabut asap tebal.';
  } else if ((isDry && isHot) || (isDry && isWindy)) {
    fireRisk = 'Tinggi (Waspada Titik Api)';
    fireRiskClass = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
    fireDesc =
      'Vegetasi semak dan lahan gambut/kering rentan terbakar. Hindari segala bentuk pembakaran terbuka.';
  } else if (isDry || isHot) {
    fireRisk = 'Sedang';
    fireRiskClass = 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800';
    fireDesc =
      'Perhatikan potensi munculnya titik panas lokal pada siang hari yang terik di sekitar wilayah ini.';
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] theme-transition">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
              Meteorologi & Arah Sebaran Asap ({cityName})
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Parameter cuaca yang menentukan pergerakan kabut asap dan kerawanan kebakaran lahan
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${fireRiskClass}`}>
          <span>Risiko Cuaca Api: {fireRisk}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Wind Direction */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Arah Tiupan Angin</span>
            <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Navigation
                className="h-5 w-5 transition-transform duration-700"
                style={{ transform: `rotate(${weather.windDirection}deg)` }}
              />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white block">
                {dirLabel}
              </span>
              <span className="text-[11px] font-medium text-slate-400 block">
                {weather.windDirection}° Azimuth
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Asap bergerak dari/ke {dirLabel}
          </p>
        </div>

        {/* Wind Speed */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Kecepatan Angin</span>
            <Gauge className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{weather.windSpeed}</span>
            <span className="ml-1 text-xs font-semibold text-slate-400">km/jam</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Hembusan maks: {weather.windGusts} km/j
          </p>
        </div>

        {/* Humidity */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Kelembapan Udara</span>
            <Droplets className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{weather.humidity}</span>
            <span className="ml-1 text-xs font-semibold text-slate-400">%</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {weather.humidity < 60 ? 'Udara kering (rawan api)' : 'Kelembapan normal'}
          </p>
        </div>

        {/* Temperature */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Suhu Permukaan</span>
            <Thermometer className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{weather.temperature}</span>
            <span className="ml-1 text-xs font-semibold text-slate-400">°C</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Terasa seperti {weather.apparentTemperature}°C
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5 text-xs text-slate-700 dark:text-slate-300">
        <strong className="text-indigo-950 dark:text-indigo-200">Analisis Meteorologi Karhutla: </strong> {fireDesc}
      </div>
    </div>
  );
};
