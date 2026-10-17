import React, { useState } from 'react';
import { Bell, Check, Share2, X } from 'lucide-react';
import type { AirQualityResponse, CityLocation, ISPUInfo, NavTab } from '../types';
import { SULTENG_CITIES } from '../constants/cities';
import { formatWITA } from '../utils/aqiCalculator';
import { NavHealthShieldIcon } from './CustomIcons';

interface FooterProps {
  data: AirQualityResponse | null;
  ispuInfo: ISPUInfo | null;
  watchlistIds: string[];
  onToggleWatchlist: (cityId: string) => void;
  onSelectCity: (city: CityLocation) => void;
  onSelectTab: (tab: NavTab) => void;
  onOpenHealthDrawer: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  data,
  ispuInfo,
  watchlistIds,
  onToggleWatchlist,
  onSelectCity,
  onSelectTab,
  onOpenHealthDrawer,
}) => {
  const [copiedToast, setCopiedToast] = useState(false);
  const [alertPopover, setAlertPopover] = useState(false);

  const currentCityId = data?.location.id || 'palu';
  const isWatched = watchlistIds.includes(currentCityId);

  const watchedCities = SULTENG_CITIES.filter((c) => watchlistIds.includes(c.id));

  const handleShare = async () => {
    if (!data || !ispuInfo) return;
    const text = `*Laporan Kualitas Udara & Kabut Asap Sulawesi Tengah*\nWilayah: *${data.location.name}*\nIndeks: *${data.current.us_aqi} AQI* / *${ispuInfo.score} ISPU KLHK* (${ispuInfo.category})\nPM2.5 Asap: *${data.current.pm2_5.toFixed(2)} µg/m³* | PM10: *${data.current.pm10.toFixed(2)} µg/m³*\nAngin: ${data.weather.windSpeed} km/jam | Suhu: ${data.weather.temperature}°C\nSaran Medis: ${ispuInfo.maskRecommendation}\nWaktu Pembaruan: ${formatWITA(data.lastUpdated)}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 3000);
      } catch {
        // Ignore clipboard error
      }
    }
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="relative border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1322] px-3.5 sm:px-7 py-2.5 shrink-0 theme-transition">
      {/* Mobile / Tablet Quick-Switch Watched Cities Bar */}
      {watchedCities.length > 0 && (
        <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 mr-0.5">
            Pantauan:
          </span>
          {watchedCities.map((c) => {
            const active = c.id === currentCityId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCity(c)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {c.name.replace('Kab. ', '').replace('Kota ', '')}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Left: Daftar Pantau, Info Siaga, Bagikan, and Desktop Watched City Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Daftar Pantau Button */}
          <button
            type="button"
            onClick={() => onToggleWatchlist(currentCityId)}
            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isWatched
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
            <span>Daftar Pantau</span>
          </button>

          {/* Bell Alert Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAlertPopover(!alertPopover)}
              title="Status Peringatan Dini Kabut Asap"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/40 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 stroke-[2]" />
            </button>

            {alertPopover && data && ispuInfo && (
              <div className="fixed inset-x-3 bottom-16 sm:absolute sm:inset-x-auto sm:bottom-11 sm:left-0 z-50 sm:w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-[0_14px_38px_rgba(15,23,42,0.25)] theme-transition">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Status Siaga Asap • {data.location.name}
                  </span>
                  <button
                    onClick={() => setAlertPopover(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 mb-2">
                  {ispuInfo.description}
                </p>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/80 p-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>
                    CO Asap: <strong className="text-slate-700 dark:text-slate-200">{data.current.carbon_monoxide.toFixed(1)} µg/m³</strong>
                  </span>
                  <span>
                    Kelembapan: <strong className="text-slate-700 dark:text-slate-200">{data.weather.humidity}%</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            title="Bagikan Laporan Kualitas Udara ke WhatsApp"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 stroke-[2]" />
          </button>

          {copiedToast && (
            <span className="hidden sm:inline-block rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              Laporan disalin ke papan klip
            </span>
          )}

          {/* Quick-Switch Watched Cities Chips (Desktop) */}
          {watchedCities.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mr-1">
                Wilayah Pantauan:
              </span>
              {watchedCities.map((c) => {
                const active = c.id === currentCityId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCity(c)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c.name.replace('Kab. ', '').replace('Kota ', '')}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Panduan Kesehatan Button & Reset Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenHealthDrawer}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <NavHealthShieldIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="sm:hidden">Kesehatan</span>
            <span className="hidden sm:inline">Panduan Kesehatan</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('air-maps')}
            title="Kembali ke Peta Utama"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
