import { useCallback, useEffect, useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CitySelector } from './components/CitySelector';
import { AQIHeroCard } from './components/AQIHeroCard';
import { PollutantGrid } from './components/PollutantGrid';
import { WeatherHazeCard } from './components/WeatherHazeCard';
import { HazeHealthAlert } from './components/HazeHealthAlert';
import { AirQualityMap } from './components/AirQualityMap';
import { HourlyForecastChart } from './components/HourlyForecastChart';
import { EmergencyContacts } from './components/EmergencyContacts';
import { Footer } from './components/Footer';
import { CitySearchModal } from './components/CitySearchModal';
import { DEFAULT_CITY, SULTENG_CITIES } from './constants/cities';
import type { AirQualityResponse, CityLocation, CitySummary, NavTab } from './types';
import {
  fetchAirQualityData,
  fetchAllSultengCitiesSummary,
  resolveLocationFromCoordinates,
  syncCityInSummaryCache,
} from './services/airQualityService';
import {
  calculatePM10ISPU,
  calculatePM25ISPU,
  formatWITA,
  getISPUColorHex,
  getISPUDetails,
} from './utils/aqiCalculator';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Satellite,
  ShieldAlert,
  X,
} from 'lucide-react';

const WATCHLIST_STORAGE_KEY = 'sulteng_air_watchlist_v1';
const THEME_STORAGE_KEY = 'sulteng_theme_pref_v1';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('air-maps');
  const [currentCity, setCurrentCity] = useState<CityLocation>(DEFAULT_CITY);
  const [data, setData] = useState<AirQualityResponse | null>(null);
  const [allSummaries, setAllSummaries] = useState<CitySummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [healthModalOpen, setHealthModalOpen] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);

  // Desktop Sidebar Collapsed State & Mobile Hamburger Drawer State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Mobile Bottom Sheet State (Default collapsed so the Map gets ~82% of mobile screen height!)
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState<boolean>(false);
  const [mobileSheetTab, setMobileSheetTab] = useState<'gauge' | 'chart'>('gauge');
  const [isMapMaximized, setIsMapMaximized] = useState<boolean>(false);

  // Theme state: defaults to system preference (prefers-color-scheme: dark)
  const [userOverrodeTheme, setUserOverrodeTheme] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      // Ignore storage error
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply .dark class to <html> and listen to system theme changes if not manually overridden
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (userOverrodeTheme || typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [userOverrodeTheme]);

  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      setUserOverrodeTheme(true);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage error
    }
    return ['palu', 'sigi', 'poso', 'morowali'];
  });

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(
    async (city: CityLocation, forceRefresh = false, silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const result = await fetchAirQualityData(city, forceRefresh);
        setData(result);

        // Keep allSummaries in exact synchronization with active city's live data
        const ispu = Math.max(
          calculatePM25ISPU(result.current.pm2_5),
          calculatePM10ISPU(result.current.pm10)
        );
        const details = getISPUDetails(ispu, result.current.us_aqi);
        const updatedSummary: CitySummary = {
          city: result.location,
          ispu,
          us_aqi: result.current.us_aqi,
          pm2_5: result.current.pm2_5,
          pm10: result.current.pm10,
          o3: result.current.ozone,
          no2: result.current.nitrogen_dioxide,
          co: result.current.carbon_monoxide,
          category: details.category,
          englishLabel: result.current.accuweatherCategory || details.englishLabel,
          emoji: details.emoji,
          colorHex: getISPUColorHex(details.category),
          statusText: details.hazeRisk,
        };
        syncCityInSummaryCache(updatedSummary);
        setAllSummaries((prev) =>
          prev.length === 0
            ? [updatedSummary]
            : prev.map((s) => (s.city.id === result.location.id ? updatedSummary : s))
        );
      } catch (err: unknown) {
        if (!silent) {
          const msg =
            err instanceof Error ? err.message : 'Gagal memuat data kualitas udara terkini';
          setError(msg);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  const loadAllSummaries = useCallback(async (forceRefresh = false) => {
    try {
      const summaries = await fetchAllSultengCitiesSummary(forceRefresh);
      setAllSummaries(summaries);
    } catch {
      // Ignore summary background error
    }
  }, []);

  // Initial load & automatic silent update every 10 seconds without manual refresh
  useEffect(() => {
    loadData(currentCity, false, false);
    loadAllSummaries(false);

    const interval = setInterval(() => {
      loadData(currentCity, true, true);
    }, 10 * 1000);

    const summaryInterval = setInterval(() => {
      loadAllSummaries(true);
    }, 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(summaryInterval);
    };
  }, [currentCity, loadData, loadAllSummaries]);

  // Handle clicking any coordinate within Provinsi Sulawesi Tengah on the OpenStreetMap
  const handleSelectCoordinate = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const resolvedLoc = await resolveLocationFromCoordinates(lat, lng);
      setCurrentCity(resolvedLoc);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Titik berada di luar wilayah administratif Sulawesi Tengah.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleWatchlist = (cityId: string) => {
    setWatchlistIds((prev) => {
      const next = prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId];
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Peramban Anda tidak mendukung fitur geolokasi GPS.');
      return;
    }

    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        try {
          const resolved = await resolveLocationFromCoordinates(latitude, longitude);
          setCurrentCity({
            ...resolved,
            name: `Lokasi GPS (${resolved.name})`,
          });
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Lokasi GPS Anda terdeteksi di luar wilayah Sulawesi Tengah.';
          setError(msg);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        setError(`Gagal mengakses GPS (${err.message}). Silakan pilih Kabupaten/Kota dari pencarian.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCityById = (cityId: string) => {
    const found = SULTENG_CITIES.find((c) => c.id === cityId);
    if (found) setCurrentCity(found);
  };

  const ispuScore = data
    ? Math.max(
        calculatePM25ISPU(data.current.pm2_5),
        calculatePM10ISPU(data.current.pm10)
      )
    : 0;

  const ispuInfo = data ? getISPUDetails(ispuScore, data.current.us_aqi) : null;

  return (
    <div
      className={`w-full min-h-dvh overflow-x-hidden bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row theme-transition ${
        activeTab === 'air-maps' ? 'h-dvh overflow-hidden' : ''
      }`}
    >
      {/* Left Sidebar (Desktop Persistent/Collapsible + Mobile Slide-Out Hamburger Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        currentCity={currentCity}
        onSelectCity={(city) => setCurrentCity(city)}
        allSummaries={allSummaries}
        watchlistIds={watchlistIds}
        onToggleWatchlist={handleToggleWatchlist}
        onUseGeolocation={handleUseGeolocation}
        geoLoading={geoLoading}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenSearch={() => {
          setMobileMenuOpen(false);
          setSearchModalOpen(true);
        }}
        onOpenHealthDrawer={() => setHealthModalOpen(true)}
        data={data}
        ispuInfo={ispuInfo}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Right Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 justify-between">
        {/* Top Header Bar (with Mobile Hamburger Button & Desktop Contextual Status) */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentCity={currentCity}
          ispuInfo={ispuInfo}
          allSummaries={allSummaries}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onOpenSearch={() => setSearchModalOpen(true)}
          onSelectCityById={handleSelectCityById}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenHealthDrawer={() => setHealthModalOpen(true)}
        />

        {/* Error Banner if any */}
        {error && (
          <div className="mx-4 mt-2 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-4 py-2.5 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                setError(null);
                loadData(currentCity, true, false);
              }}
              className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>
        )}

        {/* Loading Skeleton State (Initial Load) */}
        {loading && !data && (
          <div className="flex-1 flex flex-col items-center justify-center py-28 px-4 text-center text-slate-500 dark:text-slate-400 gap-3 bg-slate-50/40 dark:bg-[#090D16]">
            <Loader2 className="h-9 w-9 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Memuat data kualitas udara dan atmosfer untuk {currentCity.name}...
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Standar Nasional ISPU KLHK & Indeks Kualitas Udara Sulawesi Tengah
            </p>
          </div>
        )}

        {/* =====================================================================
            TAB 1: PETA UDARA (Full-Height Map on Mobile with Collapsible Info Sheet)
           ===================================================================== */}
        {data && ispuInfo && activeTab === 'air-maps' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Map Canvas Wrapper — Automatically expands when bottom sheet is minimized! */}
            <AirQualityMap
              currentCity={currentCity}
              pollutants={data.current}
              ispuInfo={ispuInfo}
              allSummaries={allSummaries}
              userLocation={userLocation}
              isDark={isDark}
              onSelectCity={(city) => setCurrentCity(city)}
              onSelectCoordinate={handleSelectCoordinate}
              onUseGeolocation={handleUseGeolocation}
              geoLoading={geoLoading}
              loading={loading}
              searchInputRef={searchInputRef}
              isMapMaximized={isMapMaximized}
              onToggleMaximizeMap={() => {
                setIsMapMaximized((prev) => {
                  const next = !prev;
                  if (next) setMobileSheetExpanded(false);
                  return next;
                });
              }}
            />

            {/* =================================================================
                MOBILE & TABLET (< lg): COLLAPSIBLE BOTTOM SHEET DRAWER
                Gives 80%+ screen space to the Map by default, expands on tap!
               ================================================================= */}
            {!isMapMaximized && (
              <div className="lg:hidden border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1322] shadow-[0_-10px_30px_rgba(15,23,42,0.12)] z-30 shrink-0 theme-transition">
                {/* Compact Summary Bar & Sheet Controls (Always Visible on Mobile) */}
                <div className="px-3.5 pt-2 pb-2.5">
                  {/* Pull Handle Indicator */}
                  <button
                    type="button"
                    onClick={() => setMobileSheetExpanded((prev) => !prev)}
                    aria-label="Buka atau tutup detail informasi udara"
                    className="w-full flex justify-center pb-1.5 cursor-pointer"
                  >
                    <span className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    {/* Left: Live AQI Badge + City Name & PM2.5 */}
                    <button
                      type="button"
                      onClick={() => setMobileSheetExpanded((prev) => !prev)}
                      className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <div
                        className="flex h-10 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-xs"
                        style={{ backgroundColor: ispuInfo.colorHex }}
                      >
                        <span className="text-xs font-extrabold leading-none">
                          {data.current.us_aqi}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-90 mt-0.5">
                          AQI
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {data.location.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[9px] font-bold shrink-0 ${ispuInfo.pillClass}`}
                          >
                            {ispuInfo.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          PM2.5: <strong className="text-slate-700 dark:text-slate-200">{data.current.pm2_5.toFixed(0)} µg/m³</strong> • Cuaca: {data.weather.weatherDesc} ({data.weather.temperature}°C)
                        </p>
                      </div>
                    </button>

                    {/* Right: Tab Switcher Pills (Indeks | Grafik) + Expand/Collapse Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800/90 p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (mobileSheetExpanded && mobileSheetTab === 'gauge') {
                              setMobileSheetExpanded(false);
                            } else {
                              setMobileSheetTab('gauge');
                              setMobileSheetExpanded(true);
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                            mobileSheetExpanded && mobileSheetTab === 'gauge'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Activity className="h-3 w-3" />
                          <span>Indeks</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (mobileSheetExpanded && mobileSheetTab === 'chart') {
                              setMobileSheetExpanded(false);
                            } else {
                              setMobileSheetTab('chart');
                              setMobileSheetExpanded(true);
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                            mobileSheetExpanded && mobileSheetTab === 'chart'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <BarChart3 className="h-3 w-3" />
                          <span>Grafik</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setMobileSheetExpanded((prev) => !prev)}
                        title={mobileSheetExpanded ? 'Perkecil Panel Info' : 'Buka Detail Info'}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        {mobileSheetExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Drawer Body (Shows either Gauge or Forecast Chart on Mobile) */}
                {mobileSheetExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 max-h-[46dvh] overflow-y-auto">
                    {mobileSheetTab === 'gauge' ? (
                      <AQIHeroCard data={data} ispuInfo={ispuInfo} isDark={isDark} />
                    ) : (
                      <HourlyForecastChart
                        hourly={data.hourly}
                        daily={data.daily}
                        cityName={data.location.name}
                        isDark={isDark}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================
                DESKTOP (lg:grid): SIDE-BY-SIDE AQI GAUGE + FORECAST CHART
               ================================================================= */}
            {!isMapMaximized && (
              <div className="hidden lg:grid lg:grid-cols-12 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 bg-white dark:bg-[#0D1322] theme-transition">
                <div className="lg:col-span-4 lg:border-r border-slate-200/80 dark:border-slate-800/80">
                  <AQIHeroCard data={data} ispuInfo={ispuInfo} isDark={isDark} />
                </div>
                <div className="lg:col-span-8">
                  <HourlyForecastChart
                    hourly={data.hourly}
                    daily={data.daily}
                    cityName={data.location.name}
                    isDark={isDark}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 2: BERANDA (Ringkasan 13 Kabupaten/Kota & Detail Polutan Sulteng)
           ===================================================================== */}
        {data && ispuInfo && activeTab === 'home' && (
          <div className="flex-1 p-4 sm:p-7 space-y-6 bg-slate-50/60 dark:bg-[#090D16] overflow-y-auto theme-transition">
            <div className="mx-auto max-w-7xl space-y-6">
              <CitySelector
                currentCity={currentCity}
                allSummaries={allSummaries}
                onSelectCity={(city) => {
                  setCurrentCity(city);
                  setActiveTab('air-maps');
                }}
                onUseGeolocation={handleUseGeolocation}
                geoLoading={geoLoading}
              />

              <PollutantGrid pollutants={data.current} />

              <WeatherHazeCard weather={data.weather} cityName={data.location.name} />
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: INFO KARHUTLA (Pantauan Karhutla, Titik Asap & Rujukan Resmi)
           ===================================================================== */}
        {data && ispuInfo && activeTab === 'newsroom' && (
          <div className="flex-1 p-4 sm:p-7 space-y-6 bg-slate-50/60 dark:bg-[#090D16] overflow-y-auto theme-transition">
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="rounded-3xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-5 sm:p-6 text-white shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="max-w-2xl">
                    <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight">
                      Pusat Informasi Kabut Asap & Karhutla Sulawesi Tengah
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Data konsentrasi partikulat asap (PM2.5, PM10), Karbon Monoksida (CO), dan ketebalan aerosol diperbarui secara otomatis setiap 10 detik dari jaringan pemantauan atmosfer dan cuaca permukaan.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5 sm:p-4 text-left sm:text-right w-full sm:w-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                      Waktu Pembaruan Data
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 block">
                      {formatWITA(data.lastUpdated)}
                    </span>
                  </div>
                </div>
              </div>

              <WeatherHazeCard weather={data.weather} cityName={data.location.name} />

              <PollutantGrid pollutants={data.current} />

              {/* Official Trusted Agencies & Links */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] p-5 sm:p-6 theme-transition">
                <div className="flex items-center gap-2 mb-4">
                  <Satellite className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
                    Portal Resmi Pemantauan Titik Panas (Hotspot) & Instansi Pemerintah
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <a
                    href="https://sipongi.menlhk.go.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                          KLHK RI
                        </span>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        SIPONGI+ Pemantauan Karhutla
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Pantauan satelit titik panas (hotspot) VIIRS & MODIS resmi Kementerian Lingkungan Hidup dan Kehutanan.
                      </p>
                    </div>
                    <span className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Buka Peta Hotspot →
                    </span>
                  </a>

                  <a
                    href="https://www.bmkg.go.id/kualitas-udara/informasi-partikulat-pm25.bmkg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 text-[10px] font-bold text-sky-800 dark:text-sky-300">
                          BMKG
                        </span>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        BMKG Kualitas Udara & Cuaca
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Informasi resmi konsentrasi partikulat PM2.5 dan peringatan dini cuaca ekstrem wilayah Sulawesi Tengah.
                      </p>
                    </div>
                    <span className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Buka Portal BMKG →
                    </span>
                  </a>

                  <a
                    href="https://ispu.menlhk.go.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          ISPU Nasional
                        </span>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Indeks Standar Pencemar Udara
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Rujukan standar perhitungan resmi Permen LHK No. 14 Tahun 2020 tentang Indeks Standar Pencemar Udara.
                      </p>
                    </div>
                    <span className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Lihat Standar ISPU →
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: PANDUAN KESEHATAN (Panduan Medis & Kontak Darurat 112 Sulteng)
           ===================================================================== */}
        {data && ispuInfo && activeTab === 'breathe-care' && (
          <div className="flex-1 p-4 sm:p-7 space-y-6 bg-slate-50/60 dark:bg-[#090D16] overflow-y-auto theme-transition">
            <div className="mx-auto max-w-7xl space-y-6">
              <HazeHealthAlert ispuInfo={ispuInfo} />
              <EmergencyContacts />
            </div>
          </div>
        )}

        {/* Bottom Action Bar (Hidden on Mobile Map View to Maximize Map Height, Visible on Desktop & Other Tabs) */}
        <div className={activeTab === 'air-maps' ? 'hidden lg:block shrink-0' : 'block shrink-0'}>
          <Footer
            data={data}
            ispuInfo={ispuInfo}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectCity={(city) => {
              setCurrentCity(city);
              setActiveTab('air-maps');
            }}
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenHealthDrawer={() => setHealthModalOpen(true)}
          />
        </div>
      </div>

      {/* =====================================================================
          PANDUAN KESEHATAN QUICK MODAL
         ===================================================================== */}
      {healthModalOpen && data && ispuInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D16] p-4 sm:p-6 shadow-2xl space-y-5 theme-transition">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Panduan Kesehatan & Kontak Darurat ({data.location.name})
                </h3>
              </div>
              <button
                onClick={() => setHealthModalOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <HazeHealthAlert ispuInfo={ispuInfo} />
            <EmergencyContacts />
          </div>
        </div>
      )}

      {/* =====================================================================
          UNIVERSAL CITY SEARCH MODAL (Apple SF style, Spotlight / iOS Modal)
         ===================================================================== */}
      <CitySearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        currentCity={currentCity}
        allSummaries={allSummaries}
        onSelectCity={(city) => {
          setCurrentCity(city);
          setActiveTab('air-maps');
        }}
        onUseGeolocation={handleUseGeolocation}
        geoLoading={geoLoading}
      />
    </div>
  );
}

export default App;
