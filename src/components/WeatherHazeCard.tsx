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

  // Wildfire weather risk estimation
  const isDry = weather.humidity < 60;
  const isHot = weather.temperature >= 32;
  const isWindy = weather.windSpeed >= 15;

  let fireRisk = 'Rendah';
  let fireRiskClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let fireDesc = 'Kondisi kelembapan cukup tinggi, risiko percikan api menyebar lambat.';

  if (isDry && isHot && isWindy) {
    fireRisk = 'Sangat Tinggi (Bahaya)';
    fireRiskClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
    fireDesc = 'Cuaca panas, kering, dan berangin kencang! Api karhutla dapat menyebar sangat cepat.';
  } else if ((isDry && isHot) || (isDry && isWindy)) {
    fireRisk = 'Tinggi (Waspada)';
    fireRiskClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    fireDesc = 'Lahan dan vegetasi semak sangat kering, potensi kebakaran mudah meluas.';
  } else if (isDry || isHot) {
    fireRisk = 'Sedang';
    fireRiskClass = 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    fireDesc = 'Perhatikan titik api, hindari membakar jerami atau sampah di ruang terbuka.';
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-sky-400" />
            <h3 className="text-base font-bold text-white sm:text-lg">
              Faktor Cuaca & Sebaran Asap
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Arah tiupan angin dan kelembapan di {cityName} yang mempengaruhi pergerakan kabut asap
          </p>
        </div>

        <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${fireRiskClass}`}>
          <span>Potensi Karhutla: {fireRisk}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Wind Speed & Direction */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Arah Angin</span>
            <Compass className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Navigation
              className="h-6 w-6 text-sky-400 transition-transform duration-700"
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            />
            <div>
              <span className="text-xl font-bold text-white block">
                {dirLabel}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                {weather.windDirection}°
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Asap bergerak ke arah {dirLabel}
          </p>
        </div>

        {/* Wind Speed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Kecepatan Angin</span>
            <Gauge className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.windSpeed}</span>
            <span className="ml-1 text-xs text-slate-400">km/jam</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {weather.windSpeed < 10 ? 'Angin sepoi-sepoi' : weather.windSpeed < 20 ? 'Angin sedang' : 'Angin kencang'}
          </p>
        </div>

        {/* Humidity */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Kelembapan Udara</span>
            <Droplets className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.humidity}</span>
            <span className="ml-1 text-xs text-slate-400">%</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {weather.humidity < 60 ? 'Kering (rawan terbakar)' : 'Cukup lembap'}
          </p>
        </div>

        {/* Temperature */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Suhu Udara</span>
            <Thermometer className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.temperature}</span>
            <span className="ml-1 text-xs text-slate-400">°C</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {weather.temperature >= 32 ? 'Terik panas' : 'Suhu normal'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300">
        <strong className="text-white">Analisis Cuaca Karhutla: </strong> {fireDesc}
      </div>
    </div>
  );
};
