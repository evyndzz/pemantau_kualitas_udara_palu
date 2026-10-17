import React, { useState } from 'react';
import type { AirQualityResponse, ISPUInfo } from '../types';
import { StatusShieldBadgeIcon } from './CustomIcons';

interface AQIHeroCardProps {
  data: AirQualityResponse;
  ispuInfo: ISPUInfo;
  isDark?: boolean;
}

export const AQIHeroCard: React.FC<AQIHeroCardProps> = ({ data, ispuInfo, isDark = false }) => {
  const [standard, setStandard] = useState<'aqi' | 'ispu'>('aqi');

  const displayScore = standard === 'aqi' ? data.current.us_aqi : ispuInfo.score;

  // Map score (0..250) onto the 240-degree arc (from 150 deg to 390 deg)
  const clampedScore = Math.max(0, Math.min(250, displayScore));
  const ratio = clampedScore / 250;
  const startAngleDeg = 150;
  const sweepAngleDeg = 240;
  const currentAngleDeg = startAngleDeg + ratio * sweepAngleDeg;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;

  const cx = 120;
  const cy = 104;
  const radius = 76;

  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = ((startAngleDeg + sweepAngleDeg) * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const thumbX = cx + radius * Math.cos(currentAngleRad);
  const thumbY = cy + radius * Math.sin(currentAngleRad);

  const arcPath = `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2}`;

  return (
    <div className="relative flex h-full flex-col items-center justify-between overflow-hidden px-5 pt-4 pb-3 select-none bg-gradient-to-b from-white via-white to-sky-50/40 dark:from-[#0D1322] dark:via-[#0D1322] dark:to-slate-900/60 theme-transition">
      {/* Subtle Pastel / Dark City Skyline Silhouette at Bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 opacity-75 dark:opacity-25">
        <svg
          viewBox="0 0 400 130"
          className="w-full h-24 sm:h-28 object-cover"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 130V85H18V65H38V80H52V50H78V75H95V42H120V78H142V60H165V82H190V48H215V72H238V55H262V80H285V38H312V74H335V58H360V82H382V68H400V130H0Z"
            fill={isDark ? '#1E293B' : '#E0F2FE'}
            fillOpacity="0.75"
          />
          <path
            d="M0 130V98H24V76H46V94H68V64H92V92H114C126 70 148 70 160 92C172 70 194 70 206 92H228V68H254V90H276V56H302V92H328V74H354V95H378V80H400V130H0Z"
            fill={isDark ? '#334155' : '#CCFBF1'}
            fillOpacity="0.65"
          />
        </svg>
      </div>

      {/* Top: City Name & Province */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white line-clamp-1">
          {data.location.name}
        </h2>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-flex h-3.5 w-3.5 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
            <svg viewBox="0 0 16 16" className="h-full w-full">
              <rect width="16" height="8" fill="#EF4444" />
              <rect y="8" width="16" height="8" fill="#FFFFFF" />
            </svg>
          </span>
          <span className="truncate max-w-[230px]">
            {data.location.district || 'Sulawesi Tengah, Indonesia'}
          </span>
        </div>

        {/* Standard Switcher Pill (US AQI vs ISPU KLHK) */}
        <div className="mt-1.5 inline-flex items-center rounded-full bg-slate-100/90 dark:bg-slate-800/90 p-0.5 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setStandard('aqi')}
            className={`rounded-full px-2.5 py-0.5 transition-all cursor-pointer ${
              standard === 'aqi'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Indeks AQI
          </button>
          <button
            type="button"
            onClick={() => setStandard('ispu')}
            className={`rounded-full px-2.5 py-0.5 transition-all cursor-pointer ${
              standard === 'ispu'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ISPU KLHK
          </button>
        </div>
      </div>

      {/* Center: Semi-Circular Rainbow Gauge */}
      <div className="relative z-10 -my-1 flex flex-col items-center justify-center">
        <svg width="240" height="175" viewBox="0 0 240 175" className="overflow-visible">
          <defs>
            <linearGradient id="aqiRainbowArc" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="26%" stopColor="#10B981" />
              <stop offset="52%" stopColor="#FACC15" />
              <stop offset="76%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
            <filter id="thumbGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Subtle background track */}
          <path
            d={arcPath}
            fill="none"
            stroke={isDark ? '#1E293B' : '#F1F5F9'}
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Rainbow Gradient Arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#aqiRainbowArc)"
            strokeWidth="9.5"
            strokeLinecap="round"
          />

          {/* Circular Thumb Indicator on the Arc */}
          <circle
            cx={thumbX}
            cy={thumbY}
            r="8"
            fill={isDark ? '#0F172A' : '#FFFFFF'}
            stroke={ispuInfo.colorHex}
            strokeWidth="4"
            filter="url(#thumbGlow)"
            className="transition-all duration-700"
          />

          {/* Center Score & Labels */}
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            className="fill-slate-900 dark:fill-white text-[40px] font-extrabold tracking-tight"
          >
            {displayScore}
          </text>
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            className="fill-slate-500 dark:fill-slate-400 text-[11px] font-bold uppercase tracking-wider"
          >
            {standard === 'aqi' ? 'INDEKS AQI' : 'INDEKS ISPU'}
          </text>
        </svg>

        {/* Bottom Status Pill inside Gauge (Clean Vector Dot + Bahasa Indonesia Category) */}
        <div
          className={`-mt-7 inline-flex items-center gap-1.5 rounded-full px-3.5 py-0.5 text-[11px] font-bold shadow-2xs ${ispuInfo.pillClass}`}
        >
          <StatusShieldBadgeIcon color={ispuInfo.colorHex} className="h-3.5 w-3.5" />
          <span>Kategori: {ispuInfo.category}</span>
        </div>
      </div>

      {/* Bottom Micro Summary with Official BMKG Weather */}
      <div className="relative z-10 mt-2 flex w-full items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2 text-[11px] text-slate-500 dark:text-slate-400 gap-2">
        <span className="truncate">
          BMKG: <strong className="text-slate-800 dark:text-slate-200">{data.weather.weatherDesc} • {data.weather.temperature}°C</strong>
        </span>
        <span className="shrink-0">
          PM2.5: <strong className="text-slate-800 dark:text-slate-200">{data.current.pm2_5.toFixed(2)} µg/m³</strong>
        </span>
      </div>
    </div>
  );
};
