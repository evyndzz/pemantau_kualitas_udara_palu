import { useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { CitySelector } from './components/CitySelector';
import { AQIHeroCard } from './components/AQIHeroCard';
import { PollutantGrid } from './components/PollutantGrid';
import { WeatherHazeCard } from './components/WeatherHazeCard';
import { HazeHealthAlert } from './components/HazeHealthAlert';
import { AirQualityMap } from './components/AirQualityMap';
import { HourlyForecastChart } from './components/HourlyForecastChart';
import { EmergencyContacts } from './components/EmergencyContacts';
import { Footer } from './components/Footer';
import { DEFAULT_CITY, SULTENG_CITIES } from './constants/cities';
import type { AirQualityResponse, CityLocation, CitySummary } from './types';
import { fetchAirQualityData, fetchAllSultengCitiesSummary } from './services/airQualityService';
import { calculatePM25ISPU, calculatePM10ISPU, getISPUDetails } from './utils/aqiCalculator';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function App() {
  const [currentCity, setCurrentCity] = useState<CityLocation>(DEFAULT_CITY);
  const [data, setData] = useState<AirQualityResponse | null>(null);
  const [allSummaries, setAllSummaries] = useState<CitySummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const loadData = useCallback(async (city: CityLocation) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAirQualityData(city);
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data kualitas udara';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllSummaries = useCallback(async () => {
    try {
      const summaries = await fetchAllSultengCitiesSummary();
      setAllSummaries(summaries);
    } catch {
      // Ignore background summary failure
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(currentCity);
    loadAllSummaries();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadData(currentCity);
      loadAllSummaries();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentCity, loadData, loadAllSummaries]);

  // Handle Geolocation
  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung geolokasi GPS.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Find closest Sulteng city
        let closest = SULTENG_CITIES[0];
        let minDistance = Number.MAX_VALUE;

        SULTENG_CITIES.forEach((city) => {
          const d = Math.hypot(city.lat - latitude, city.lng - longitude);
          if (d < minDistance) {
            minDistance = d;
            closest = city;
          }
        });

        const customLoc: CityLocation = {
          id: 'user-current-loc',
          name: `Lokasi Anda (dekat ${closest.name})`,
          label: 'Lokasi Anda Sekarang',
          district: 'Koordinat GPS Perangkat',
          lat: latitude,
          lng: longitude,
          description: `Titik koordinat perangkat Anda: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
        };

        setCurrentCity(customLoc);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        alert(`Gagal mendeteksi lokasi GPS: ${err.message}. Silakan pilih manual dari daftar kab/kota.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Calculate current ISPU details
  const ispuScore = data
    ? Math.max(
        calculatePM25ISPU(data.current.pm2_5),
        calculatePM10ISPU(data.current.pm10)
      )
    : 0;

  const ispuInfo = data ? getISPUDetails(ispuScore) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-slate-950">
      <Navbar
        data={data}
        ispuInfo={ispuInfo}
        loading={loading}
        onRefresh={() => {
          loadData(currentCity);
          loadAllSummaries();
        }}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* City selector & GPS button */}
        <CitySelector
          currentCity={currentCity}
          onSelectCity={(city) => setCurrentCity(city)}
          onUseGeolocation={handleUseGeolocation}
          geoLoading={geoLoading}
        />

        {/* Error state */}
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
            <button
              onClick={() => loadData(currentCity)}
              className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading state indicator */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            <p className="text-sm font-medium">Mengambil data atmosfer dan mutu udara {currentCity.name}...</p>
          </div>
        )}

        {/* Main Content when data exists */}
        {data && ispuInfo && (
          <div className="space-y-6">
            {/* Hero Card */}
            <AQIHeroCard data={data} ispuInfo={ispuInfo} />

            {/* Pollutant Grid */}
            <PollutantGrid pollutants={data.current} />

            {/* Interactive Map & Weather in 2-col on large screens */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <AirQualityMap
                  currentCity={currentCity}
                  allSummaries={allSummaries}
                  userLocation={userLocation}
                  onSelectCity={(city) => setCurrentCity(city)}
                />
              </div>
              <div className="lg:col-span-4">
                <WeatherHazeCard weather={data.weather} cityName={data.location.name} />
              </div>
            </div>

            {/* Hourly Forecast Chart */}
            <HourlyForecastChart hourly={data.hourly} cityName={data.location.name} />

            {/* Haze Health Guidelines */}
            <HazeHealthAlert />

            {/* Emergency Contacts */}
            <EmergencyContacts />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

