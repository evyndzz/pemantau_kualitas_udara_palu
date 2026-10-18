import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { SULTENG_CITIES } from '../constants/cities';
import type { CityLocation, CitySummary } from '../types';
import { GpsTargetIcon, StatusShieldBadgeIcon } from './CustomIcons';

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: CityLocation;
  allSummaries: CitySummary[];
  onSelectCity: (city: CityLocation) => void;
  onUseGeolocation: () => void;
  geoLoading: boolean;
}

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  allSummaries,
  onSelectCity,
  onUseGeolocation,
  geoLoading,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const filteredCities = SULTENG_CITIES.filter((city) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      city.name.toLowerCase().includes(q) ||
      city.label.toLowerCase().includes(q) ||
      city.district.toLowerCase().includes(q)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="city-search-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0D1322]/95 shadow-[0_25px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200 theme-transition"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
          <div className="flex-1 flex items-center gap-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 px-3.5 py-2.5 shadow-inner">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 stroke-[2.2]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Kabupaten atau Kota di Sulteng..."
              className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-3 w-3 stroke-[2.5]" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>

        {/* GPS Option */}
        <div className="px-3.5 sm:px-4 pt-3 pb-1.5">
          <button
            type="button"
            onClick={() => {
              onUseGeolocation();
              handleClose();
            }}
            disabled={geoLoading}
            className="w-full flex items-center justify-between rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 px-3.5 py-2.5 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer disabled:opacity-60"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {geoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
              ) : (
                <GpsTargetIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              )}
              <div>
                <p className="truncate font-extrabold leading-tight">Deteksi Titik GPS Lokasi Saya</p>
                <p className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 font-medium truncate mt-0.5">
                  Dapatkan data kualitas atmosfer persis di koordinat Anda
                </p>
              </div>
            </div>
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
              GPS
            </span>
          </button>
        </div>

        {/* Cities List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 pt-1 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          <div className="flex items-center justify-between py-1.5 px-1">
            <span id="city-search-title" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {query ? `Hasil Pencarian (${filteredCities.length})` : '13 Kabupaten & Kota di Sulawesi Tengah'}
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Pilih untuk membuka peta
            </span>
          </div>

          {filteredCities.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <MapPin className="h-8 w-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Wilayah tidak ditemukan
              </p>
              <p className="text-[11px] mt-0.5 text-slate-400">
                Coba gunakan kata kunci nama kabupaten, kota, atau kecamatan di Sulteng
              </p>
            </div>
          ) : (
            filteredCities.map((city) => {
              const summary = allSummaries.find((s) => s.city.id === city.id);
              const isSelected = city.id === currentCity.id;

              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    handleClose();
                  }}
                  className={`w-full flex items-center justify-between rounded-2xl p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/70 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <StatusShieldBadgeIcon
                      color={summary?.colorHex || '#10B981'}
                      className="h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-xs sm:text-sm truncate ${
                            isSelected
                              ? 'font-extrabold text-indigo-700 dark:text-indigo-300'
                              : 'font-bold text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {city.name}
                        </p>
                        {isSelected && (
                          <span className="rounded-md bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {city.label} • {city.district}
                      </p>
                    </div>
                  </div>

                  {summary && (
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div className="text-right">
                        <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          {summary.pm2_5.toFixed(1)} µg/m³
                        </span>
                        <span className="block text-[9px] font-medium text-slate-400">
                          PM2.5 Asap
                        </span>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-extrabold text-white shadow-xs"
                        style={{ backgroundColor: summary.colorHex }}
                      >
                        {summary.us_aqi} AQI
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
