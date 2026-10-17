import React, { useState } from 'react';
import { Clock, Flame, TrendingUp } from 'lucide-react';
import type { HourlyPoint } from '../types';
import { formatHourShort } from '../utils/aqiCalculator';

interface HourlyForecastChartProps {
  hourly: HourlyPoint[];
  cityName: string;
}

export const HourlyForecastChart: React.FC<HourlyForecastChartProps> = ({ hourly, cityName }) => {
  const [activeMetric, setActiveMetric] = useState<'pm2_5' | 'pm10' | 'ispu'>('pm2_5');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take next 24 to 36 hours for optimal readable graph
  const displayPoints = hourly.slice(0, 36);

  if (displayPoints.length === 0) {
    return null;
  }

  const values = displayPoints.map((p) => p[activeMetric]);
  const maxVal = Math.max(...values, activeMetric === 'pm2_5' ? 30 : 60);
  const minVal = 0;

  // SVG dimensions
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = displayPoints.map((p, idx) => {
    const val = p[activeMetric];
    const x = paddingX + (idx / (displayPoints.length - 1)) * chartWidth;
    const y = height - paddingY - ((val - minVal) / (maxVal - minVal || 1)) * chartHeight;
    return { x, y, val, point: p, idx };
  });

  // SVG smooth path string
  const pathD = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cpx1 = prev.x + (curr.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (curr.x - prev.x) / 2;
    const cpy2 = curr.y;
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // Color config based on metric
  const colorMap = {
    pm2_5: {
      stroke: '#f59e0b',
      fill: 'url(#gradient-pm25)',
      unit: 'µg/m³',
      title: 'PM2.5 (Asap Karhutla Halus)',
      threshold: 55.4,
    },
    pm10: {
      stroke: '#38bdf8',
      fill: 'url(#gradient-pm10)',
      unit: 'µg/m³',
      title: 'PM10 (Abu Pembakaran & Debu)',
      threshold: 150,
    },
    ispu: {
      stroke: '#10b981',
      fill: 'url(#gradient-ispu)',
      unit: 'Indeks',
      title: 'Proyeksi Indeks ISPU',
      threshold: 100,
    },
  };

  const currentConfig = colorMap[activeMetric];
  const activeHover = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white sm:text-lg">
              Prakiraan Tren Kabut Asap (36 Jam)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Prediksi dinamika partikel asap dan kualitas udara jam demi jam di {cityName}
          </p>
        </div>

        {/* Metric toggles */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setActiveMetric('pm2_5')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeMetric === 'pm2_5'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PM2.5 (Asap)
          </button>
          <button
            onClick={() => setActiveMetric('pm10')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeMetric === 'pm10'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PM10 (Abu)
          </button>
          <button
            onClick={() => setActiveMetric('ispu')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeMetric === 'ispu'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ISPU
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[600px] select-none"
        >
          <defs>
            <linearGradient id="gradient-pm25" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-pm10" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-ispu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#334155"
          />

          {/* Safe threshold reference line */}
          {currentConfig.threshold < maxVal && (
            <g>
              <line
                x1={paddingX}
                y1={height - paddingY - (currentConfig.threshold / maxVal) * chartHeight}
                x2={width - paddingX}
                y2={height - paddingY - (currentConfig.threshold / maxVal) * chartHeight}
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeDasharray="5 5"
                opacity="0.6"
              />
              <text
                x={width - paddingX - 4}
                y={height - paddingY - (currentConfig.threshold / maxVal) * chartHeight - 4}
                fill="#f87171"
                fontSize="10"
                textAnchor="end"
                fontWeight="bold"
              >
                Batas Waspada ({currentConfig.threshold})
              </text>
            </g>
          )}

          {/* Area fill */}
          <path d={areaD} fill={currentConfig.fill} />

          {/* Stroke path */}
          <path
            d={pathD}
            fill="none"
            stroke={currentConfig.stroke}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Vertical indicator line when hovering */}
          {activeHover && (
            <line
              x1={activeHover.x}
              y1={paddingY}
              x2={activeHover.x}
              y2={height - paddingY}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Interactive points & hover capture */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                {/* Big transparent rect for easy mouse hover */}
                <rect
                  x={pt.x - 10}
                  y={0}
                  width={20}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Visual circle dot */}
                {(isHovered || i % 4 === 0) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 3}
                    fill="#0f172a"
                    stroke={currentConfig.stroke}
                    strokeWidth={isHovered ? 3 : 2}
                  />
                )}
                {/* X-axis time label (every ~4 intervals) */}
                {i % 4 === 0 && (
                  <text
                    x={pt.x}
                    y={height - 10}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {formatHourShort(pt.point.time)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Card */}
        {activeHover && (
          <div
            className="pointer-events-none absolute -top-2 rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
            style={{
              left: `${(activeHover.x / width) * 100}%`,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              <span>{formatHourShort(activeHover.point.time)} WITA</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 font-black text-white">
              <span className="text-base" style={{ color: currentConfig.stroke }}>
                {activeHover.val}
              </span>
              <span className="text-[10px] text-slate-400">{currentConfig.unit}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              ISPU: <strong className="text-slate-200">{activeHover.point.ispu}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          <span>Biasanya kabut asap karhutla paling pekat pada <strong>pukul 05.00 - 08.00 pagi</strong> akibat inversi suhu malam.</span>
        </div>
        <span className="text-slate-500">Waktu Indonesia Tengah (WITA)</span>
      </div>
    </div>
  );
};
