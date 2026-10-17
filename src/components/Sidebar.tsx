import React, { useEffect } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  Share2,
  X,
} from 'lucide-react';
import type {
  AirQualityResponse,
  CityLocation,
  CitySummary,
  ISPUInfo,
  NavTab,
} from '../types';
import { SULTENG_CITIES } from '../constants/cities';
import { formatWITA } from '../utils/aqiCalculator';
import {
  BrandAirIcon,
  GpsTargetIcon,
  MoonModeIcon,
  NavHealthShieldIcon,
  NavKarhutlaIcon,
  NavMapLayerIcon,
  NavOverviewIcon,
  StatusShieldBadgeIcon,
  SunModeIcon,
} from './CustomIcons';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  allSummaries: CitySummary[];
  watchlistIds: string[];
  onToggleWatchlist: (cityId: string) => void;
  onUseGeolocation: () => void;
  geoLoading: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenHealthDrawer: () => void;
  data: AirQualityResponse | null;
  ispuInfo: ISPUInfo | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentCity,
  onSelectCity,
  allSummaries,
  watchlistIds,
  onToggleWatchlist,
  onUseGeolocation,
  geoLoading,
  isDark,
  onToggleTheme,
  onOpenSearch,
  onOpenHealthDrawer,
  data,
  ispuInfo,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Prevent background body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navItems: {
    id: NavTab;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'air-maps',
      label: 'Peta Udara',
      desc: 'Peta interaktif & polutan',
      icon: <NavMapLayerIcon className="h-5 w-5 shrink-0" />,
    },
    {
      id: 'home',
      label: 'Beranda Wilayah',
      desc: '13 Kab/Kota Sulawesi Tengah',
      icon: <NavOverviewIcon className="h-5 w-5 shrink-0" />,
    },
    {
      id: 'newsroom',
      label: 'Info Karhutla',
      desc: 'Titik panas & meteorologi',
      icon: <NavKarhutlaIcon className="h-5 w-5 shrink-0" />,
    },
    {
      id: 'breathe-care',
      label: 'Panduan Kesehatan',
      desc: 'Protokol medis & darurat 112',
      icon: <NavHealthShieldIcon className="h-5 w-5 shrink-0" />,
    },
  ];

  // Sort cities so watched cities appear first, then alphabetical
  const sortedCities = [...SULTENG_CITIES].sort((a, b) => {
    const aWatched = watchlistIds.includes(a.id) ? 1 : 0;
    const bWatched = watchlistIds.includes(b.id) ? 1 : 0;
    if (aWatched !== bWatched) return bWatched - aWatched;
    return a.name.localeCompare(b.name);
  });

  const handleShareWhatsApp = () => {
    if (!data || !ispuInfo) return;
    const text = `*Laporan Kualitas Udara & Kabut Asap Sulawesi Tengah*\nWilayah: *${data.location.name}*\nIndeks: *${data.current.us_aqi} AQI* / *${ispuInfo.score} ISPU KLHK* (${ispuInfo.category})\nPM2.5 Asap: *${data.current.pm2_5.toFixed(2)} µg/m³* | PM10: *${data.current.pm10.toFixed(2)} µg/m³*\nAngin: ${data.weather.windSpeed} km/jam | Suhu: ${data.weather.temperature}°C\nSaran Medis: ${ispuInfo.maskRecommendation}\nWaktu Pembaruan: ${formatWITA(data.lastUpdated)}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* =====================================================================
          DESKTOP SIDEBAR (lg:flex — Persistent & Collapsible)
         ===================================================================== */}
      <aside
        className={`hidden lg:flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1322] shrink-0 select-none z-30 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCollapsed ? 'w-[78px]' : 'w-[272px]'
        }`}
      >
        {/* Top Brand + Collapse Button */}
        <div className="flex flex-col">
          <div
            className={`flex h-16 items-center border-b border-slate-200/80 dark:border-slate-800/80 px-4 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectTab('air-maps')}
              className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer min-w-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-800/50 shadow-2xs transition-transform duration-300 group-hover:scale-105">
                <BrandAirIcon className="h-6 w-6" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[16px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                    UdaraSulteng
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">
                    Sulawesi Tengah
                  </span>
                </div>
              )}
            </button>

            {!isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Ciutkan Sidebar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {isCollapsed && (
            <div className="flex justify-center py-2 border-b border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Perluas Sidebar"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation Menu Section */}
          <div className="p-3 space-y-1">
            {!isCollapsed && (
              <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Menu Navigasi
              </p>
            )}
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  }`}
                >
                  <div className={isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-tight truncate">{item.label}</p>
                      <p
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick GPS & Search Action Buttons */}
          <div className="px-3 pb-3 space-y-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onUseGeolocation}
              disabled={geoLoading}
              title="Deteksi Titik GPS Lokasi Saya"
              className={`w-full flex items-center gap-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/50 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              {geoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <GpsTargetIcon className="h-4 w-4 shrink-0" />
              )}
              {!isCollapsed && <span className="truncate">Deteksi Lokasi GPS</span>}
            </button>

            <button
              type="button"
              onClick={onOpenSearch}
              title="Cari Kabupaten/Kota"
              className={`w-full flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              {!isCollapsed && <span className="truncate">Cari Wilayah Sulteng...</span>}
            </button>
          </div>
        </div>

        {/* Middle Scrollable List: 13 Kabupaten/Kota Quick Switcher */}
        {!isCollapsed ? (
          <div className="flex-1 min-h-0 flex flex-col px-3 py-2.5 overflow-hidden">
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Wilayah Pantauan ({SULTENG_CITIES.length})
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                AQI / PM2.5
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {sortedCities.map((city) => {
                const summary = allSummaries.find((s) => s.city.id === city.id);
                const isSelected = currentCity.id === city.id;
                const isWatched = watchlistIds.includes(city.id);

                return (
                  <div
                    key={city.id}
                    className={`group flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/70'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCity(city);
                        onSelectTab('air-maps');
                      }}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <StatusShieldBadgeIcon
                        color={summary?.colorHex || '#10B981'}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs truncate ${
                            isSelected
                              ? 'font-extrabold text-indigo-700 dark:text-indigo-300'
                              : 'font-semibold text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {city.name.replace('Kab. ', '')}
                        </p>
                        {summary && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            PM2.5: {summary.pm2_5.toFixed(1)} µg/m³
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {summary && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white"
                          style={{ backgroundColor: summary.colorHex }}
                        >
                          {summary.us_aqi}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleWatchlist(city.id)}
                        title={isWatched ? 'Hapus dari Daftar Pantau' : 'Tambah ke Daftar Pantau'}
                        className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                          isWatched
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 text-transparent hover:border-indigo-400'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center py-3 gap-2 overflow-y-auto">
            {sortedCities.slice(0, 6).map((city) => {
              const summary = allSummaries.find((s) => s.city.id === city.id);
              const isSelected = currentCity.id === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    onSelectTab('air-maps');
                  }}
                  title={`${city.name} (${summary ? `${summary.us_aqi} AQI` : ''})`}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-[10px] font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-600/25 scale-105'
                      : 'border-slate-200 dark:border-slate-800 opacity-85 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: summary ? summary.colorHex : '#10B981',
                    color: '#FFFFFF',
                  }}
                >
                  {summary ? summary.us_aqi : city.name.slice(0, 2)}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Sidebar Controls: Theme Switch & Emergency Action */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 p-3 space-y-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/90 px-3 py-2 border border-slate-200/60 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {isDark ? 'Mode Gelap' : 'Mode Terang'}
              </span>
              <button
                type="button"
                onClick={onToggleTheme}
                role="switch"
                aria-checked={isDark}
                className="relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border border-slate-200/90 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-800 p-0.5 transition-colors duration-500 cursor-pointer"
              >
                <span className="flex w-full items-center justify-between px-1 text-slate-400">
                  <SunModeIcon className="h-3 w-3" />
                  <MoonModeIcon className="h-3 w-3" />
                </span>
                <span
                  className={`absolute top-0.5 left-0.5 flex h-5.5 w-5.5 items-center justify-center rounded-full shadow-xs transition-all duration-500 ${
                    isDark
                      ? 'translate-x-7 bg-indigo-600 text-white'
                      : 'translate-x-0 bg-white text-amber-500'
                  }`}
                >
                  {isDark ? (
                    <MoonModeIcon className="h-3 w-3" />
                  ) : (
                    <SunModeIcon className="h-3 w-3" />
                  )}
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleTheme}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {isDark ? (
                <MoonModeIcon className="h-4 w-4 text-indigo-400" />
              ) : (
                <SunModeIcon className="h-4 w-4 text-amber-500" />
              )}
            </button>
          )}
        </div>
      </aside>

      {/* =====================================================================
          MOBILE HAMBURGER SLIDE-OVER DRAWER (< lg)
         ===================================================================== */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          mobileOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Slide-In Drawer Panel */}
        <aside
          className={`relative flex h-full w-[295px] max-w-[86vw] flex-col justify-between bg-white dark:bg-[#0D1322] border-r border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60">
                <BrandAirIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  UdaraSulteng
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Pantauan Udara & Karhutla
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup Menu"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Current Selected Location Card */}
            {data && ispuInfo && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {data.location.name}
                    </span>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white shrink-0"
                    style={{ backgroundColor: ispuInfo.colorHex }}
                  >
                    {data.current.us_aqi} AQI
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Kategori: <strong className="text-slate-700 dark:text-slate-200">{ispuInfo.category}</strong></span>
                  <span>PM2.5: <strong className="text-slate-700 dark:text-slate-200">{data.current.pm2_5.toFixed(2)} µg/m³</strong></span>
                </div>
              </div>
            )}

            {/* Main Navigation Links */}
            <div className="space-y-1">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Menu Utama
              </p>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 font-medium'
                    }`}
                  >
                    <div className={isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-tight">{item.label}</p>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions (GPS & Emergency Guide & Share) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <p className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pintasan Cepat
              </p>
              <button
                type="button"
                onClick={() => {
                  onUseGeolocation();
                  onSelectTab('air-maps');
                  onCloseMobile();
                }}
                disabled={geoLoading}
                className="w-full flex items-center gap-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
              >
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GpsTargetIcon className="h-4 w-4" />
                )}
                <span>Deteksi Lokasi GPS Saya</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenHealthDrawer();
                    onCloseMobile();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <NavHealthShieldIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Info Medis</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Bagikan WA</span>
                </button>
              </div>
            </div>

            {/* 13 Kabupaten & Kota List in Mobile Drawer */}
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Pilih Wilayah Sulteng (13)
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Indeks AQI
                </span>
              </div>

              <div className="space-y-1">
                {sortedCities.map((city) => {
                  const summary = allSummaries.find((s) => s.city.id === city.id);
                  const isSelected = currentCity.id === city.id;
                  const isWatched = watchlistIds.includes(city.id);

                  return (
                    <div
                      key={city.id}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/70'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCity(city);
                          onSelectTab('air-maps');
                          onCloseMobile();
                        }}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <StatusShieldBadgeIcon
                          color={summary?.colorHex || '#10B981'}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs truncate ${
                              isSelected
                                ? 'font-extrabold text-indigo-700 dark:text-indigo-300'
                                : 'font-semibold text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {city.name}
                          </p>
                          {summary && (
                            <p className="text-[10px] text-slate-400 truncate">
                              PM2.5: {summary.pm2_5.toFixed(1)} µg/m³ • {summary.statusText}
                            </p>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {summary && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: summary.colorHex }}
                          >
                            {summary.us_aqi}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleWatchlist(city.id)}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                            isWatched
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 dark:border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drawer Footer: Theme Toggle */}
          <div className="border-t border-slate-200/80 dark:border-slate-800 px-4 py-3 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Tema Tampilan ({isDark ? 'Gelap' : 'Terang'})
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              role="switch"
              aria-checked={isDark}
              className="relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-800 p-1 transition-colors duration-500 cursor-pointer"
            >
              <span className="flex w-full items-center justify-between px-1 text-slate-400">
                <SunModeIcon className="h-3.5 w-3.5" />
                <MoonModeIcon className="h-3.5 w-3.5" />
              </span>
              <span
                className={`absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all duration-500 ${
                  isDark
                    ? 'translate-x-8 bg-indigo-600 text-white'
                    : 'translate-x-0 bg-white text-amber-500'
                }`}
              >
                {isDark ? (
                  <MoonModeIcon className="h-3.5 w-3.5" />
                ) : (
                  <SunModeIcon className="h-3.5 w-3.5" />
                )}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};

