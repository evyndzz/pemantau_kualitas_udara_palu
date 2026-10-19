import React, { useMemo, useState } from 'react';
import type { DailyPoint, HourlyPoint } from '../types';
import { formatHourShort, formatTooltipDate } from '../utils/aqiCalculator';

interface HourlyForecastChartProps {
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  cityName: string;
  isDark?: boolean;
}

type TimeRangeTab = 'Per Jam' | 'Harian' | 'Bulanan' | 'Tahunan';

interface ChartItem {
  label: string;
  dateLabel: string;
  pm2_5: number;
  aqi: number;
  ispu: number;
  isForecast: boolean;
}

const HourlyForecastChartComponent: React.FC<HourlyForecastChartProps> = ({
  hourly,
  daily,
  cityName,
  isDark = false,
}) => {
  const [activeRange, setActiveRange] = useState<TimeRangeTab>('Per Jam');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const series: ChartItem[] = useMemo(() => {
    if (activeRange === 'Per Jam') {
      const slice = hourly.slice(0, 13);
      return slice.map((pt, idx) => ({
        label: formatHourShort(pt.time),
        dateLabel: `${formatTooltipDate(pt.time)} • ${formatHourShort(pt.time)}`,
        pm2_5: pt.pm2_5,
        aqi: pt.us_aqi,
        ispu: pt.ispu,
        isForecast: idx > 7,
      }));
    }

    if (activeRange === 'Harian') {
      return daily.map((d, idx) => ({
        label: d.label,
        dateLabel: `Prakiraan Harian • ${d.label}`,
        pm2_5: d.pm2_5,
        aqi: d.us_aqi,
        ispu: d.ispu,
        isForecast: idx > 1,
      }));
    }

    const basePm = hourly[0]?.pm2_5 || 11.5;
    const baseAqi = hourly[0]?.us_aqi || 32;

    if (activeRange === 'Bulanan') {
      const months = [
        { m: 'Jan', factor: 0.75 },
        { m: 'Feb', factor: 0.72 },
        { m: 'Mar', factor: 0.8 },
        { m: 'Apr', factor: 0.85 },
        { m: 'Mei', factor: 0.9 },
        { m: 'Jun', factor: 1.05 },
        { m: 'Jul', factor: 1.2 },
        { m: 'Agu', factor: 1.45 },
        { m: 'Sep', factor: 1.55 },
        { m: 'Okt', factor: 1.0 },
        { m: 'Nov', factor: 0.88 },
        { m: 'Des', factor: 0.78 },
      ];
      return months.map((item, idx) => {
        const pm = Number((basePm * item.factor).toFixed(2));
        const aqi = Math.round(baseAqi * item.factor);
        return {
          label: item.m,
          dateLabel: `Rata-rata ${item.m} 2026 • ${cityName}`,
          pm2_5: pm,
          aqi,
          ispu: aqi,
          isForecast: idx >= 9,
        };
      });
    }

    const years = [
      { y: '2021', factor: 0.88 },
      { y: '2022', factor: 0.84 },
      { y: '2023', factor: 1.38 },
      { y: '2024', factor: 1.05 },
      { y: '2025', factor: 0.96 },
      { y: '2026', factor: 1.0 },
      { y: '2027*', factor: 0.92 },
    ];
    return years.map((item, idx) => {
      const pm = Number((basePm * item.factor).toFixed(2));
      const aqi = Math.round(baseAqi * item.factor);
      return {
        label: item.y,
        dateLabel: `Indeks Tahunan ${item.y} • ${cityName}`,
        pm2_5: pm,
        aqi,
        ispu: aqi,
        isForecast: idx >= 5,
      };
    });
  }, [activeRange, cityName, daily, hourly]);

  const defaultFocusIdx = useMemo(() => {
    const firstForecast = series.findIndex((s) => s.isForecast);
    if (firstForecast > 0) return firstForecast - 1;
    return Math.floor(series.length / 2);
  }, [series]);

  if (series.length === 0) return null;

  const activeIdx =
    hoveredIdx !== null && hoveredIdx < series.length ? hoveredIdx : defaultFocusIdx;

  const width = 720;
  const height = 225;
  const padLeft = 28;
  const padRight = 32;
  const padTop = 64;
  const padBottom = 34;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const vals = series.map((s) => s.pm2_5);
  const maxVal = Math.max(...vals, 18) * 1.25;
  const minVal = 0;

  const coords = series.map((item, idx) => {
    const x = padLeft + (idx / Math.max(1, series.length - 1)) * chartW;
    const norm = (item.pm2_5 - minVal) / (maxVal - minVal || 1);
    const y = padTop + chartH - norm * chartH;
    return { x, y, item, idx };
  });

  const buildSmoothPath = (pts: typeof coords) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, curr, i, arr) => {
      if (i === 0) return `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
      const prev = arr[i - 1];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.45;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.55;
      const cpy2 = curr.y;
      return `${acc} C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }, '');
  };

  const solidPoints = coords.slice(0, activeIdx + 1);
  const dashedPoints = coords.slice(activeIdx);

  const solidPath = buildSmoothPath(solidPoints);
  const dashedPath = buildSmoothPath(dashedPoints);

  const baselineY = padTop + chartH;
  const solidAreaPath =
    solidPoints.length > 1
      ? `${solidPath} L ${solidPoints[solidPoints.length - 1].x.toFixed(1)} ${baselineY} L ${solidPoints[0].x.toFixed(1)} ${baselineY} Z`
      : '';

  const activePoint = coords[activeIdx] || coords[0];
  const tooltipLeftPct = Math.max(24, Math.min(76, (activePoint.x / width) * 100));
  const tooltipTopPct = Math.max(0, Math.min(32, ((activePoint.y - 60) / height) * 100));

  return (
    <div className="relative flex h-full flex-col justify-between px-4 sm:px-7 pt-4 pb-3 select-none bg-white dark:bg-[#0D1322] theme-transition">
      {/* Header Row: Title on Left, Pill Switcher on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Prakiraan Kualitas Udara
          </h3>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Tren konsentrasi partikel PM2.5 (µg/m³) & indeks udara di {cityName}
          </p>
        </div>

        {/* Time Range Pill Switcher (Per Jam | Harian | Bulanan | Tahunan) */}
        <div className="grid grid-cols-4 sm:inline-flex items-center rounded-full bg-slate-100/90 dark:bg-slate-800/90 p-1 w-full sm:w-auto">
          {(['Per Jam', 'Harian', 'Bulanan', 'Tahunan'] as TimeRangeTab[]).map((tab) => {
            const isSelected = activeRange === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveRange(tab);
                  setHoveredIdx(null);
                }}
                className={`rounded-full px-2 sm:px-3.5 py-1 text-[11px] font-bold transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Container with Right Rainbow Vertical Scale Bar */}
      <div className="relative mt-2 flex items-center gap-2">
        <div className="relative flex-1 overflow-visible">
          {/* Floating Tooltip Card with Mini Rainbow Gauge (Percentage-positioned for mobile & desktop) */}
          <div
            className="pointer-events-none absolute z-20 flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-2.5 sm:px-3 py-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.14)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur-xs transition-all duration-200"
            style={{
              left: `${tooltipLeftPct}%`,
              top: `${tooltipTopPct}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                {activePoint.item.pm2_5.toFixed(2)}
                <span className="ml-1 text-[10px] font-semibold text-slate-400">µg/m³</span>
              </div>
              <div className="text-[9px] sm:text-[10px] font-medium text-slate-400 whitespace-nowrap mt-0.5">
                {activePoint.item.dateLabel}
              </div>
            </div>

            {/* Mini Rainbow Arc Gauge inside Tooltip */}
            <div className="relative flex h-7 w-9 sm:h-8 sm:w-10 items-center justify-center shrink-0">
              <svg viewBox="0 0 44 38" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="miniTipArc" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="35%" stopColor="#10B981" />
                    <stop offset="70%" stopColor="#FACC15" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
                <path
                  d="M 7 31 A 16 16 0 1 1 37 31"
                  fill="none"
                  stroke={isDark ? '#1E293B' : '#F1F5F9'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 7 31 A 16 16 0 1 1 37 31"
                  fill="none"
                  stroke="url(#miniTipArc)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <text
                  x="22"
                  y="24"
                  textAnchor="middle"
                  className="fill-slate-900 dark:fill-white text-[10px] font-extrabold"
                >
                  {activePoint.item.aqi}
                </text>
                <text
                  x="22"
                  y="32"
                  textAnchor="middle"
                  className="fill-slate-400 text-[6px] font-bold uppercase"
                >
                  AQI
                </text>
              </svg>
            </div>
          </div>

          {/* SVG Spline Chart */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[175px] sm:h-[185px] overflow-visible"
          >
            <defs>
              <pattern
                id="stippleDots"
                x="0"
                y="0"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="2"
                  cy="2"
                  r="1.15"
                  fill="#22C55E"
                  fillOpacity={isDark ? '0.45' : '0.38'}
                />
              </pattern>

              <linearGradient id="forecastStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#84CC16" />
                <stop offset="60%" stopColor="#ACC92B" />
                <stop offset="100%" stopColor="#EAB308" />
              </linearGradient>
            </defs>

            {/* Vertical Dashed Grid Lines & X-Axis Labels */}
            {coords.map((pt) => {
              return (
                <g key={pt.idx}>
                  <line
                    x1={pt.x}
                    y1={padTop - 24}
                    x2={pt.x}
                    y2={baselineY}
                    stroke={isDark ? '#1E293B' : '#E2E8F0'}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={pt.x}
                    y={height - 8}
                    textAnchor="middle"
                    className={`text-[11px] sm:text-[10px] transition-colors ${
                      pt.idx === activeIdx
                        ? 'fill-slate-900 dark:fill-white font-bold'
                        : 'fill-slate-400 dark:fill-slate-500 font-medium'
                    }`}
                  >
                    {pt.item.label}
                  </text>
                </g>
              );
            })}

            {/* Dotted Matrix Area Fill under Past/Current Curve */}
            {solidAreaPath && <path d={solidAreaPath} fill="url(#stippleDots)" />}

            {/* Solid Green Spline Curve (Past & Current) */}
            <path
              d={solidPath}
              fill="none"
              stroke="#22C55E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dashed Forecast Spline Curve (Upcoming Hours/Days) */}
            {dashedPath && (
              <path
                d={dashedPath}
                fill="none"
                stroke="url(#forecastStrokeGrad)"
                strokeWidth="2.6"
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Vertical Solid Green Stem Line at Active Point */}
            <line
              x1={activePoint.x}
              y1={activePoint.y}
              x2={activePoint.x}
              y2={baselineY}
              stroke="#65A30D"
              strokeWidth="2"
            />

            {/* Active Circular Node with White/Dark Center & Green Ring */}
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="6.5"
              fill={isDark ? '#0F172A' : '#FFFFFF'}
              stroke="#65A30D"
              strokeWidth="3.5"
            />

            {/* Interactive Hover / Click Columns */}
            {coords.map((pt) => {
              const colW = chartW / Math.max(1, coords.length - 1);
              return (
                <rect
                  key={pt.idx}
                  x={pt.x - colW / 2}
                  y={0}
                  width={colW}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(pt.idx)}
                  onClick={() => setHoveredIdx(pt.idx)}
                />
              );
            })}
          </svg>
        </div>

        {/* Right Edge Vertical Rainbow Scale Bar */}
        <div className="h-[145px] sm:h-[155px] w-1.5 rounded-full bg-gradient-to-b from-purple-600 via-rose-500 via-amber-400 via-emerald-500 to-cyan-400 shrink-0 mb-4" />
      </div>
    </div>
  );
};

export const HourlyForecastChart = React.memo(HourlyForecastChartComponent);
