import React from 'react';
import { AlertTriangle, Flame, HeartPulse, Info, ShieldAlert } from 'lucide-react';
import type { AirQualityResponse, ISPUInfo } from '../types';
import { formatWITA } from '../utils/aqiCalculator';

interface AQIHeroCardProps {
  data: AirQualityResponse;
  ispuInfo: ISPUInfo;
}

export const AQIHeroCard: React.FC<AQIHeroCardProps> = ({ data, ispuInfo }) => {
  const { current, location, lastUpdated } = data;

  // Determine progress percentage for visual bar (0 - 300+ mapped to 0% - 100%)
  const percentage = Math.min(100, Math.max(5, (ispuInfo.score / 300) * 100));

  // Compare PM2.5 with WHO safe guideline (15 µg/m³ 24h)
  const whoRatio = (current.pm2_5 / 15).toFixed(1);

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${ispuInfo.borderClass} bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8`}>
      {/* Background glow effect based on air status */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{
          backgroundColor:
            ispuInfo.category === 'BAIK'
              ? '#10b981'
              : ispuInfo.category === 'SEDANG'
              ? '#38bdf8'
              : ispuInfo.category === 'TIDAK SEHAT'
              ? '#f59e0b'
              : ispuInfo.category === 'SANGAT TIDAK SEHAT'
              ? '#ef4444'
              : '#9333ea',
        }}
      />

      <div className="relative z-10">
        {/* Header row: Location & update time */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white sm:text-2xl lg:text-3xl">
                {location.name}
              </span>
              <span className="rounded-lg bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                Sulteng
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {location.description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pembaruan: <strong>{formatWITA(lastUpdated)}</strong></span>
          </div>
        </div>

        {/* Main AQI / ISPU display section */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          {/* Big number badge */}
          <div className="flex flex-col sm:flex-row lg:col-span-5 items-start sm:items-center gap-5">
            <div className={`flex flex-col items-center justify-center rounded-3xl border ${ispuInfo.borderClass} ${ispuInfo.bgClass} p-6 shadow-xl w-36 h-36 shrink-0`}>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                ISPU KLHK
              </span>
              <span className="text-5xl font-black tracking-tighter">
                {ispuInfo.score}
              </span>
              <span className="text-[11px] font-bold mt-1">
                Indeks
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-block rounded-xl px-3.5 py-1 text-sm font-extrabold tracking-wide uppercase ${ispuInfo.badgeBg}`}>
                  {ispuInfo.category}
                </span>

                <span className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  US AQI: {current.us_aqi}
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <Flame className={`h-4 w-4 ${ispuInfo.score > 100 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-sm font-semibold text-slate-200">
                  Status Bahaya Asap: <strong className={ispuInfo.textClass}>{ispuInfo.hazeRisk}</strong>
                </span>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {ispuInfo.description}
              </p>
            </div>
          </div>

          {/* Scale meter bar */}
          <div className="lg:col-span-7 flex flex-col justify-center rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>Rentang Kualitas Udara (Permen LHK No. 14/2020)</span>
              <span className="font-bold text-slate-200">{ispuInfo.score} / 300+</span>
            </div>

            {/* Custom Multi-tier gradient progress bar */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
              <div className="grid h-full w-full grid-cols-5 rounded-full overflow-hidden">
                <div className="bg-emerald-500" title="0-50: Baik" />
                <div className="bg-sky-500" title="51-100: Sedang" />
                <div className="bg-amber-500" title="101-200: Tidak Sehat" />
                <div className="bg-rose-500" title="201-300: Sangat Tidak Sehat" />
                <div className="bg-purple-900" title=">300: Berbahaya" />
              </div>
              {/* Indicator needle */}
              <div
                className="absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full border-2 border-white bg-slate-950 shadow-lg transition-all duration-500"
                style={{ left: `${percentage}%` }}
              />
            </div>

            <div className="mt-2 grid grid-cols-5 text-center text-[10px] font-bold text-slate-400">
              <span className="text-emerald-400">Baik (0-50)</span>
              <span className="text-sky-400">Sedang (100)</span>
              <span className="text-amber-400">Tdk Sehat (200)</span>
              <span className="text-rose-400">Sgt Buruk (300)</span>
              <span className="text-purple-400">Bahaya (300+)</span>
            </div>

            {/* Key PM2.5 karhutla metric */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Partikel Utama Karhutla (PM2.5):</span>
                <span className="text-base font-extrabold text-white">
                  {current.pm2_5} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                <Info className="h-3.5 w-3.5 text-sky-400" />
                <span>
                  {Number(whoRatio) > 1
                    ? `${whoRatio}x batas aman harian WHO`
                    : 'Di bawah batas rekomendasi WHO'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action recommendations box */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5">
            <ShieldAlert className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Penggunaan Masker</h4>
              <p className="mt-0.5 text-xs text-slate-400 leading-snug">
                {ispuInfo.maskRecommendation}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5">
            <HeartPulse className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Aktivitas Luar Ruang</h4>
              <p className="mt-0.5 text-xs text-slate-400 leading-snug">
                {ispuInfo.outdoorAdvice}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Kelompok Rentan</h4>
              <p className="mt-0.5 text-xs text-slate-400 leading-snug">
                {ispuInfo.vulnerableGroupAdvice}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
