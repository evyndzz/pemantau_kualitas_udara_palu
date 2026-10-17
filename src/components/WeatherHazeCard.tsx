import React from 'react';
import { Cloud, Compass, Droplets, Gauge, Navigation, ShieldCheck, Thermometer, Wind } from 'lucide-react';
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
  let fireRiskClass =
    'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
  let fireDesc =
    'Kelembapan udara cukup tinggi dan suhu terkendali berdasarkan pantauan BMKG, potensi rambatan api permukaan relatif lambat.';

  if (isDry && isHot && isWindy) {
    fireRisk = 'Sangat Tinggi (Bahaya Karhutla)';
    fireRiskClass =
      'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800';
    fireDesc =
      'Cuaca terik, kering, dan berangin kencang. Titik api karhutla dapat menjalar sangat cepat dan membawa kabut asap tebal.';
  } else if ((isDry && isHot) || (isDry && isWindy)) {
    fireRisk = 'Tinggi (Waspada Titik Api)';
    fireRiskClass =
      'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
    fireDesc =
      'Vegetasi semak dan lahan gambut/kering rentan terbakar. Hindari segala bentuk pembakaran terbuka.';
  } else if (isDry || isHot) {
    fireRisk = 'Sedang';
    fireRiskClass =
      'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800';
    fireDesc =
      'Perhatikan potensi munculnya titik panas lokal pada siang hari yang terik di sekitar wilayah ini.';
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] theme-transition">
      {/* Header with AccuWeather Verification Badge */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Wind className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
              Kondisi Cuaca & Meteorologi ({cityName})
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
              <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span>AccuWeather.com</span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Stasiun / Wilayah:{' '}
              <strong className="text-slate-700 dark:text-slate-200">
                {weather.bmkgStationName || cityName}
              </strong>
            </span>
            {weather.accuweatherUrl && (
              <a
                href={weather.accuweatherUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <span>Buka di AccuWeather</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold shrink-0 ${fireRiskClass}`}
        >
          <span>Risiko Cuaca Api: {fireRisk}</span>
        </div>
      </div>

      {/* Main AccuWeather Condition + 4 Core Meteorology Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
        {/* Current Weather Condition */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-sky-100 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/30 p-4 flex sm:flex-col items-center sm:items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 block">
              Cuaca AccuWeather
            </span>
            <span className="mt-1.5 text-base font-extrabold text-slate-900 dark:text-white block">
              {weather.weatherDesc || 'Sedikit awan'}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Cloud className="h-3 w-3" />
              <span>Tutupan Awan: {weather.cloudCover ?? 60}%</span>
            </span>
          </div>
          {weather.weatherIconUrl && (
            <img
              src={weather.weatherIconUrl}
              alt={weather.weatherDesc}
              className="h-12 w-12 object-contain shrink-0 drop-shadow-xs"
            />
          )}
        </div>

        {/* Wind Direction */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Arah Angin BMKG</span>
            <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
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
                {weather.windDirection}° ({weather.windDirectionCode || 'SE'})
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
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {weather.windSpeed}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">km/jam</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Data anemometer sinoptik BMKG
          </p>
        </div>

        {/* Humidity */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Kelembapan (RH)</span>
            <Droplets className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {weather.humidity}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">%</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {weather.humidity < 60 ? 'Udara kering (rawan titik api)' : 'Kelembapan udara normal'}
          </p>
        </div>

        {/* Temperature */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Suhu AccuWeather</span>
            <Thermometer className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {weather.temperature}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">°C</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            RealFeel® {weather.apparentTemperature}°C {weather.realFeelLabel ? `(${weather.realFeelLabel})` : ''}
          </p>
        </div>
      </div>

      {/* 3-Hourly Official BMKG Weather Forecast Strip */}
      {weather.bmkgForecasts && weather.bmkgForecasts.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Prakiraan Cuaca Per 3 Jam Resmi BMKG ({weather.bmkgStationName || cityName})
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Zona Waktu: WITA (UTC+8)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {weather.bmkgForecasts.map((slot, idx) => {
              const timePart = slot.localDatetime.split(' ')[1]?.slice(0, 5) || slot.localDatetime;
              const datePart = slot.localDatetime.split(' ')[0]?.slice(5) || '';
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-2.5 text-center"
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {timePart} <span className="text-[9px] opacity-75">({datePart})</span>
                  </span>
                  {slot.weatherIconUrl ? (
                    <img
                      src={slot.weatherIconUrl}
                      alt={slot.weatherDesc}
                      className="my-1.5 h-8 w-8 object-contain"
                    />
                  ) : (
                    <Cloud className="my-1.5 h-6 w-6 text-sky-500" />
                  )}
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {slot.weatherDesc}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                    <span>{slot.temperature}°C</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-sky-600 dark:text-sky-400">{slot.humidity}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5 text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-indigo-950 dark:text-indigo-200">
            Analisis Meteorologi Karhutla (BMKG):{' '}
          </strong>{' '}
          {fireDesc}
        </div>
        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
          Sumber: {weather.sourceLabel}
        </span>
      </div>
    </div>
  );
};
