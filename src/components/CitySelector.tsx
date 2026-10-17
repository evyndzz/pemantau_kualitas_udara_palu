import React from 'react';
import { ArrowUpRight, Loader2, MapPin } from 'lucide-react';
import { SULTENG_CITIES } from '../constants/cities';
import type { CityLocation, CitySummary } from '../types';
import { GpsTargetIcon } from './CustomIcons';

interface CitySelectorProps {
  currentCity: CityLocation;
  allSummaries: CitySummary[];
  onSelectCity: (city: CityLocation) => void;
  onUseGeolocation: () => void;
  geoLoading: boolean;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  currentCity,
  allSummaries,
  onSelectCity,
  onUseGeolocation,
  geoLoading,
}) => {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] theme-transition">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
              Pantauan 13 Kabupaten & Kota di Sulawesi Tengah
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pilih wilayah untuk membuka peta interaktif sebaran polutan dan prakiraan kualitas udara
          </p>
        </div>

        <button
          type="button"
          onClick={onUseGeolocation}
          disabled={geoLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-60"
        >
          {geoLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <GpsTargetIcon className="h-3.5 w-3.5" />
          )}
          <span>Deteksi Lokasi GPS Saya</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {SULTENG_CITIES.map((city) => {
          const summary = allSummaries.find((s) => s.city.id === city.id);
          const isSelected = currentCity.id === city.id;

          return (
            <button
              key={city.id}
              type="button"
              onClick={() => onSelectCity(city)}
              className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-600/15'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-indigo-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {city.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{city.label}</p>
                  </div>
                  {summary ? (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white shrink-0"
                      style={{ backgroundColor: summary.colorHex }}
                    >
                      {summary.us_aqi} AQI
                    </span>
                  ) : (
                    <span className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  )}
                </div>

                <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {city.description}
                </p>
              </div>

              {summary && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    PM2.5: <strong className="text-slate-800 dark:text-slate-200">{summary.pm2_5.toFixed(2)} µg/m³</strong>
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <span>ISPU {summary.ispu}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
