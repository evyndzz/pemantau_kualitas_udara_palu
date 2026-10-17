import React from 'react';
import { Compass, MapPin, Navigation } from 'lucide-react';
import { SULTENG_CITIES } from '../constants/cities';
import type { CityLocation } from '../types';

interface CitySelectorProps {
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  onUseGeolocation: () => void;
  geoLoading: boolean;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  currentCity,
  onSelectCity,
  onUseGeolocation,
  geoLoading,
}) => {
  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-sky-400" />
          <span className="text-sm font-semibold text-slate-200">
            Pilih Wilayah Sulawesi Tengah:
          </span>
        </div>

        {/* Action: Use GPS */}
        <button
          onClick={onUseGeolocation}
          disabled={geoLoading}
          className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-semibold text-sky-300 transition-all hover:border-sky-400 hover:bg-sky-500/20 active:scale-95 disabled:opacity-50"
        >
          <Navigation className={`h-3.5 w-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
          <span>{geoLoading ? 'Mencari Posisi...' : '📍 Gunakan Lokasi GPS Saya'}</span>
        </button>
      </div>

      {/* Pill buttons for fast access */}
      <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
        {SULTENG_CITIES.map((city) => {
          const isSelected = city.id === currentCity.id;
          return (
            <button
              key={city.id}
              onClick={() => onSelectCity(city)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-sky-500 font-semibold text-slate-950 shadow-md shadow-sky-500/20 ring-2 ring-sky-300'
                  : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              {city.name}
              {city.isProvincialCapital && (
                <span className="ml-1 text-[10px] opacity-75">(Ibukota)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current selection summary */}
      <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Compass className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="truncate">
            Titik Pantau: <strong className="text-slate-200">{currentCity.name}</strong> ({currentCity.lat.toFixed(4)}°, {currentCity.lng.toFixed(4)}°)
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-slate-500">13 Kab/Kota Sulteng</span>
      </div>
    </div>
  );
};
