import React from 'react';
import { Activity, CloudFog, Flame, Sparkles, Sun, Wind } from 'lucide-react';
import type { CurrentPollutants } from '../types';
import { getPollutantPercentage } from '../utils/aqiCalculator';

interface PollutantGridProps {
  pollutants: CurrentPollutants;
}

export const PollutantGrid: React.FC<PollutantGridProps> = ({ pollutants }) => {
  const items = [
    {
      key: 'PM2.5',
      title: 'Partikel Halus Asap (PM2.5)',
      value: pollutants.pm2_5.toFixed(2),
      unit: 'µg/m³',
      pct: getPollutantPercentage('pm2_5', pollutants.pm2_5),
      limit: 'Batas Aman KLHK: 15.5 µg/m³',
      desc: 'Partikel mikroskopis kabut asap karhutla yang dapat menembus paru-paru hingga aliran darah.',
      icon: <CloudFog className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      badgeClass:
        pollutants.pm2_5 <= 15.5
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          : pollutants.pm2_5 <= 55.4
            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    },
    {
      key: 'PM10',
      title: 'Partikel Debu & Abu (PM10)',
      value: pollutants.pm10.toFixed(2),
      unit: 'µg/m³',
      pct: getPollutantPercentage('pm10', pollutants.pm10),
      limit: 'Batas Aman ISPU: 50 µg/m³',
      desc: 'Abu pembakaran vegetasi hutan/semak dan debu kasar di atmosfer.',
      icon: <Wind className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
      badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    },
    {
      key: 'O3',
      title: 'Ozon Permukaan (O3)',
      value: pollutants.ozone.toFixed(2),
      unit: 'µg/m³',
      pct: getPollutantPercentage('o3', pollutants.ozone),
      limit: 'Ambang Referensi: 100 µg/m³',
      desc: 'Gas fotokimia yang terbentuk dari reaksi polutan asap dengan sinar matahari terik.',
      icon: <Sun className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
      badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    },
    {
      key: 'NO2',
      title: 'Nitrogen Dioksida (NO2)',
      value: pollutants.nitrogen_dioxide.toFixed(2),
      unit: 'µg/m³',
      pct: getPollutantPercentage('no2', pollutants.nitrogen_dioxide),
      limit: 'Ambang Referensi: 25 µg/m³',
      desc: 'Gas hasil pembakaran biomassa suhu tinggi dan emisi kendaraan bermotor.',
      icon: <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
      badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    },
    {
      key: 'CO',
      title: 'Karbon Monoksida (CO Asap)',
      value: pollutants.carbon_monoxide.toFixed(1),
      unit: 'µg/m³',
      pct: getPollutantPercentage('co', pollutants.carbon_monoxide),
      limit: 'Indikator Pembakaran Lahan',
      desc: 'Penanda khas pembakaran tidak sempurna dari kayu, gambut, dan lahan kering.',
      icon: <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    {
      key: 'AOD',
      title: 'Ketebalan Optik Asap (AOD)',
      value: pollutants.aerosol_optical_depth.toFixed(2),
      unit: 'Indeks',
      pct: Math.min(99, Math.round(pollutants.aerosol_optical_depth * 100)),
      limit: 'Normal < 0.20',
      desc: 'Mengukur seberapa pekat kolom kabut asap menghalangi cahaya matahari.',
      icon: <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
      badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)] theme-transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                {item.icon}
              </div>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {item.key}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.title}</p>
              </div>
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.badgeClass}`}
            >
              {item.pct}% Indeks
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {item.value}
            </span>
            <span className="text-xs font-semibold text-slate-400">{item.unit}</span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {item.desc}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <span>{item.limit}</span>
            <span>Terukur</span>
          </div>
        </div>
      ))}
    </div>
  );
};
