import React, { useState } from 'react';
import { Bell, MapPin, Menu, Search } from 'lucide-react';
import type { CityLocation, CitySummary, ISPUInfo, NavTab } from '../types';
import appLogo from '../assets/icon.jpeg';
import {
  MoonModeIcon,
  NavHealthShieldIcon,
  StatusShieldBadgeIcon,
  SunModeIcon,
} from './CustomIcons';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentCity: CityLocation;
  ispuInfo: ISPUInfo | null;
  allSummaries: CitySummary[];
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onSelectCityById: (cityId: string) => void;
  onOpenMobileMenu: () => void;
  onOpenHealthDrawer: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  'air-maps': {
    title: 'Peta Sebaran Kualitas Udara',
    subtitle: 'Pemantauan partikulat asap & indeks udara wilayah Sulawesi Tengah',
  },
  home: {
    title: 'Beranda 13 Kabupaten & Kota',
    subtitle: 'Ringkasan indeks kualitas udara dan konsentrasi polutan regional',
  },
  newsroom: {
    title: 'Pusat Informasi Karhutla & Asap',
    subtitle: 'Pantauan meteorologi sebaran asap dan rujukan portal resmi pemerintah',
  },
  'breathe-care': {
    title: 'Panduan Kesehatan & Darurat 112',
    subtitle: 'Protokol perlindungan medis ISPA dan layanan darurat Sulawesi Tengah',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentCity,
  ispuInfo,
  allSummaries,
  isDark,
  onToggleTheme,
  onOpenSearch,
  onSelectCityById,
  onOpenMobileMenu,
  onOpenHealthDrawer,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);

  // Top 5 regions by PM2.5 concentration
  const sortedAlertCities = [...allSummaries].sort((a, b) => b.pm2_5 - a.pm2_5).slice(0, 5);
  const currentHeader = TAB_TITLES[activeTab];

  return (
    <header className="relative z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1322] px-3.5 sm:px-6 theme-transition shrink-0">
      <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
        {/* Left: Hamburger Button (Mobile) + Brand / Page Context (Desktop) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Hamburger Menu Trigger (Visible on Mobile & Tablet < lg) */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Buka Menu Navigasi"
            className="flex lg:hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all cursor-pointer"
          >
            <Menu className="h-5 w-5 stroke-[2.2]" />
          </button>

          {/* Mobile Brand & Active City */}
          <button
            type="button"
            onClick={() => onSelectTab('air-maps')}
            className="flex lg:hidden items-center gap-2 text-left min-w-0 cursor-pointer"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <img src={appLogo} alt="Logo UdaraSulteng" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                UdaraSulteng
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate leading-tight">
                {currentCity.name}
              </span>
            </div>
          </button>

          {/* Desktop Contextual Title & Active Location Pill */}
          <div className="hidden lg:flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                {currentHeader.title}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {currentHeader.subtitle}
              </p>
            </div>

            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

            <div className="flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-1 shrink-0">
              <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {currentCity.name}
              </span>
              {ispuInfo && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
                  style={{ backgroundColor: ispuInfo.colorHex }}
                >
                  {ispuInfo.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Search, Haze Status Summary Bell, Health Shortcut, and Theme Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Health Modal Trigger (Desktop) */}
          <button
            type="button"
            onClick={onOpenHealthDrawer}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <NavHealthShieldIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Panduan Medis</span>
          </button>

          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            title="Cari Kabupaten/Kota di Sulawesi Tengah"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2]" />
          </button>

          {/* Regional Air Status Summary Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              title="Ringkasan Indeks Udara Wilayah Sulawesi Tengah"
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2]" />
              <span className="absolute top-1.5 right-1.5 sm:right-2 h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-2 ring-white dark:ring-[#0D1322]" />
            </button>

            {notifOpen && (
              <div className="fixed inset-x-3 top-15 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.25)] z-50 theme-transition">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Ringkasan Konsentrasi PM2.5 Tertinggi
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {sortedAlertCities.map((item) => (
                    <button
                      key={item.city.id}
                      type="button"
                      onClick={() => {
                        onSelectCityById(item.city.id);
                        onSelectTab('air-maps');
                        setNotifOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-xl p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors border border-slate-100 dark:border-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StatusShieldBadgeIcon color={item.colorHex} className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {item.city.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            PM2.5: <strong className="text-slate-700 dark:text-slate-200">{item.pm2_5.toFixed(2)} µg/m³</strong> • {item.statusText}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 ml-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: item.colorHex }}
                        >
                          {item.us_aqi} AQI
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">ISPU {item.ispu}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smooth Animated Light / Dark Mode Switch Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            title={isDark ? 'Mode Gelap Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Gelap)'}
            className="relative inline-flex h-8 w-[62px] sm:h-9 sm:w-[72px] shrink-0 items-center rounded-full border border-slate-200/90 dark:border-slate-700/90 bg-slate-100 dark:bg-slate-800/90 p-1 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer focus:outline-none"
          >
            {/* Background Icons */}
            <span className="flex w-full items-center justify-between px-1 sm:px-1.5 text-slate-400 dark:text-slate-500">
              <SunModeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <MoonModeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>

            {/* Animated Sliding Thumb with Morphing Active Icon */}
            <span
              className={`absolute top-1 left-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isDark
                  ? 'translate-x-[28px] sm:translate-x-[35px] bg-indigo-600 text-white'
                  : 'translate-x-0 bg-white text-amber-500'
              }`}
            >
              {isDark ? (
                <MoonModeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 scale-100" />
              ) : (
                <SunModeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 scale-100" />
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
