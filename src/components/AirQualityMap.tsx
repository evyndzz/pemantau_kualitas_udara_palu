import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { CityLocation, CitySummary } from '../types';
import { MapPin } from 'lucide-react';

interface AirQualityMapProps {
  currentCity: CityLocation;
  allSummaries: CitySummary[];
  userLocation: { lat: number; lng: number } | null;
  onSelectCity: (city: CityLocation) => void;
}

export const AirQualityMap: React.FC<AirQualityMapProps> = ({
  currentCity,
  allSummaries,
  userLocation,
  onSelectCity,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Sulawesi Tengah center ~ -1.1, 121.2
      const map = L.map(mapContainerRef.current, {
        center: [-1.15, 121.2],
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark style tile layer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Attribution
      L.control
        .attribution({ position: 'bottomright' })
        .addAttribution('&copy; <a href="https://openstreetmap.org" class="text-slate-400">OpenStreetMap</a> & CartoDB')
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map instance alive during life of component
    };
  }, []);

  // Update markers whenever summaries or selection change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Add city markers
    allSummaries.forEach((summary) => {
      const isSelected = summary.city.id === currentCity.id;
      const color = summary.colorHex;

      const customIcon = L.divIcon({
        className: 'custom-aqi-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            ${
              isSelected
                ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width: ${isSelected ? '36px' : '28px'};
              height: ${isSelected ? '36px' : '28px'};
              border-radius: 9999px;
              background-color: #0f172a;
              border: 3px solid ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 14px rgba(0,0,0,0.6);
              color: white;
              font-size: ${isSelected ? '11px' : '9px'};
              font-weight: 800;
              transition: all 0.2s;
              cursor: pointer;
            ">
              ${summary.ispu}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([summary.city.lat, summary.city.lng], { icon: customIcon });

      const popupContent = `
        <div style="padding: 6px 2px; min-width: 170px;">
          <div style="font-size: 13px; font-weight: 800; color: #f8fafc; margin-bottom: 2px;">
            ${summary.city.name}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            ${summary.city.district}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11px; color: #cbd5e1;">Indeks ISPU:</span>
            <span style="font-size: 12px; font-weight: 800; color: ${color};">${summary.ispu} (${summary.category})</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 11px; color: #cbd5e1;">PM2.5 Karhutla:</span>
            <span style="font-size: 11px; font-weight: 700; color: #f8fafc;">${summary.pm2_5} µg/m³</span>
          </div>
          <button id="btn-select-${summary.city.id}" style="
            width: 100%;
            background-color: #0284c7;
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 6px 10px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
          ">
            Lihat Detail Wilayah Ini
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${summary.city.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectCity(summary.city);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectCity(summary.city);
      });

      group.addLayer(marker);
    });

    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-loc-marker',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            border-radius: 9999px;
            background-color: #38bdf8;
            border: 3px solid #ffffff;
            box-shadow: 0 0 15px #38bdf8;
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindTooltip('Posisi GPS Anda', { permanent: false, direction: 'top' });
      group.addLayer(userMarker);
    }
  }, [allSummaries, currentCity, userLocation, onSelectCity]);

  // Center on current city when selected
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentCity.lat, currentCity.lng], 8.5, {
        duration: 1.2,
      });
    }
  }, [currentCity]);

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-400" />
            <h3 className="text-base font-bold text-white sm:text-lg">
              Peta Sebaran Mutu Udara Sulawesi Tengah
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Klik titik koordinat atau lingkaran indeks untuk memantau detail wilayah tersebut
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Baik
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Sedang
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Tdk Sehat
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Sangat Buruk
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-700" /> Berbahaya
          </span>
        </div>
      </div>

      <div className="h-[380px] w-full overflow-hidden rounded-2xl border border-slate-800 relative z-0">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>📍 Fokus Wilayah: <strong>{currentCity.name}</strong></span>
        <span>Sumber: Open-Meteo & OpenStreetMap</span>
      </div>
    </div>
  );
};
