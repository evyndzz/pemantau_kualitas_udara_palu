import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Compass,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  MousePointerClick,
  Plus,
} from 'lucide-react';
import type {
  CityLocation,
  CitySummary,
  CurrentPollutants,
  ISPUInfo,
  PollutantVisibility,
} from '../types';
import { isWithinSultengRegion } from '../services/airQualityService';
import { getAccuWeatherAQIColorHex, getPollutantPercentage } from '../utils/aqiCalculator';
import {
  LayerControlIcon,
  VisibilityOffIcon,
  VisibilityOnIcon,
} from './CustomIcons';

interface AirQualityMapProps {
  currentCity: CityLocation;
  pollutants: CurrentPollutants;
  ispuInfo: ISPUInfo;
  allSummaries: CitySummary[];
  userLocation: { lat: number; lng: number } | null;
  isDark: boolean;
  onSelectCity: (city: CityLocation) => void;
  onSelectCoordinate: (lat: number, lng: number) => void;
  onUseGeolocation: () => void;
  geoLoading: boolean;
  loading?: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isMapMaximized?: boolean;
  onToggleMaximizeMap?: () => void;
}

// Geographic bounding box centered on Sulawesi Tengah & its surrounding gulfs/seas
const SULTENG_REGIONAL_BOUNDS = L.latLngBounds(
  L.latLng(-4.8, 118.0),
  L.latLng(2.6, 126.0)
);

/**
 * Generates an organic tilted elliptical polygon around a lat/lng center
 */
function createOrganicContourLatLngs(
  lat: number,
  lng: number,
  radiusLat: number,
  radiusLng: number,
  tiltDeg = 28,
  points = 48
): [number, number][] {
  const coords: [number, number][] = [];
  const tiltRad = (tiltDeg * Math.PI) / 180;
  const cosT = Math.cos(tiltRad);
  const sinT = Math.sin(tiltRad);

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * Math.PI * 2;
    const wave = 1 + 0.08 * Math.sin(theta * 3) + 0.05 * Math.cos(theta * 2);
    const x = radiusLng * wave * Math.cos(theta);
    const y = radiusLat * wave * Math.sin(theta);

    const rotLng = x * cosT - y * sinT;
    const rotLat = x * sinT + y * cosT;
    coords.push([lat + rotLat, lng + rotLng]);
  }
  return coords;
}

/**
 * Molecular dot cluster SVG icon inside each pollutant bubble
 */
const MoleculeClusterIcon: React.FC<{ color?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  color = '#10B981',
  size = 'md',
}) => {
  const dim = size === 'lg' ? 20 : size === 'md' ? 16 : 13;
  return (
    <svg width={dim} height={dim} viewBox="0 0 28 28" fill="none" className="mx-auto mb-0.5 shrink-0">
      <circle cx="14" cy="14" r="3.2" fill={color} />
      <circle cx="14" cy="6.5" r="2.2" fill={color} fillOpacity="0.75" />
      <circle cx="20.5" cy="10.2" r="2.0" fill={color} fillOpacity="0.6" />
      <circle cx="20.5" cy="17.8" r="2.3" fill={color} fillOpacity="0.8" />
      <circle cx="14" cy="21.5" r="1.9" fill={color} fillOpacity="0.55" />
      <circle cx="7.5" cy="17.8" r="2.1" fill={color} fillOpacity="0.7" />
      <circle cx="7.5" cy="10.2" r="2.4" fill={color} fillOpacity="0.85" />
    </svg>
  );
};

const AirQualityMapComponent: React.FC<AirQualityMapProps> = ({
  currentCity,
  pollutants,
  ispuInfo,
  allSummaries,
  userLocation,
  isDark,
  onSelectCity,
  onSelectCoordinate,
  onUseGeolocation: _onUseGeolocation,
  geoLoading: _geoLoading,
  loading = false,
  searchInputRef: _searchInputRef,
  isMapMaximized = false,
  onToggleMaximizeMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const contoursRef = useRef<L.LayerGroup | null>(null);
  const interactTimeoutRef = useRef<number | null>(null);

  const [mapZoom, setMapZoom] = useState<number>(11);
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const containerWidthRef = useRef<number>(containerWidth);
  useEffect(() => {
    containerWidthRef.current = containerWidth;
  }, [containerWidth]);
  const [isMapInteracting, setIsMapInteracting] = useState<boolean>(false);
  const [bubblesHiddenManually, setBubblesHiddenManually] = useState<boolean>(false);
  // On mobile (< 640px), default to compact bottom pill strip so the map view is wide open and never blocked by giant bubbles
  const [mobileOrbitalBubbles, setMobileOrbitalBubbles] = useState<boolean>(false);
  const [pinPixelPos, setPinPixelPos] = useState<{ x: number; y: number } | null>(null);

  // Default closed on mobile (< 768px) so the map is unobstructed; open on desktop
  const [viewOptionsOpen, setViewOptionsOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );
  const [pollutantMenuExpanded, setPollutantMenuExpanded] = useState(true);

  const [appliedVisibility, setAppliedVisibility] = useState<PollutantVisibility>({
    pm2_5: true,
    pm10: true,
    o3: true,
    no2: true,
    co: false,
    aqiColorArea: true,
  });

  const [draftVisibility, setDraftVisibility] = useState<PollutantVisibility>({
    pm2_5: true,
    pm10: true,
    o3: true,
    no2: true,
    co: false,
    aqiColorArea: true,
  });

  const [selectedBubbleInfo, setSelectedBubbleInfo] = useState<string | null>(null);
  const [outsideWarning, setOutsideWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!outsideWarning) return;
    const timer = window.setTimeout(() => {
      setOutsideWarning(null);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [outsideWarning]);

  const onSelectCoordinateRef = useRef(onSelectCoordinate);
  useEffect(() => {
    onSelectCoordinateRef.current = onSelectCoordinate;
  }, [onSelectCoordinate]);

  const currentCityRef = useRef(currentCity);
  useEffect(() => {
    currentCityRef.current = currentCity;
  }, [currentCity]);

  const updatePinScreenPosition = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      const pt = map.latLngToContainerPoint([
        currentCityRef.current.lat,
        currentCityRef.current.lng,
      ]);
      setPinPixelPos({ x: pt.x, y: pt.y });
      setMapZoom(map.getZoom());
    } catch {
      // Ignore transient projection error if map is resizing
    }
  }, []);

  // Initialize Leaflet Map once and attach ResizeObserver for mobile orientation/layout stability
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
      (container as unknown as { _leaflet_id?: number })._leaflet_id = undefined;
    }

    const initialZoom = window.innerWidth < 640 ? 10 : 11;

    const map = L.map(container, {
      center: [currentCityRef.current.lat, currentCityRef.current.lng],
      zoom: initialZoom,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: SULTENG_REGIONAL_BOUNDS,
      maxBoundsViscosity: 0.85,
      zoomControl: false,
      attributionControl: false,
    });

    // Official OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 5,
      subdomains: ['a', 'b', 'c'],
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    L.control
      .attribution({ position: 'bottomleft', prefix: false })
      .addTo(map);

    const contoursGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    contoursRef.current = contoursGroup;
    markersRef.current = markersGroup;
    mapInstanceRef.current = map;

    const handleInteractStart = () => {
      if (interactTimeoutRef.current) {
        window.clearTimeout(interactTimeoutRef.current);
      }
      setIsMapInteracting(true);
    };

    const handleInteractEnd = () => {
      updatePinScreenPosition();
      if (interactTimeoutRef.current) {
        window.clearTimeout(interactTimeoutRef.current);
      }
      interactTimeoutRef.current = window.setTimeout(() => {
        setIsMapInteracting(false);
        updatePinScreenPosition();
      }, 150);
    };

    map.on('movestart', handleInteractStart);
    map.on('zoomstart', handleInteractStart);
    // Note: Do not attach setState on 'move' and 'zoom' events during active pan/pinch
    // Leaflet moves GPU canvas natively at 60 FPS without React re-render overhead!
    map.on('moveend', handleInteractEnd);
    map.on('zoomend', handleInteractEnd);
    map.on('resize', updatePinScreenPosition);

    // Click anywhere on map: restricted strictly to Provinsi Sulawesi Tengah (13 Kabupaten/Kota)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const check = isWithinSultengRegion(e.latlng.lat, e.latlng.lng);
      if (!check.valid) {
        setOutsideWarning(
          `Titik (${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)}) berada di ${check.reason}. Pemantau ini khusus untuk 13 Kabupaten/Kota di Provinsi Sulawesi Tengah.`
        );
        return;
      }
      setOutsideWarning(null);
      onSelectCoordinateRef.current(e.latlng.lat, e.latlng.lng);
    });

    const syncSizeTimer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
      setContainerWidth(container.clientWidth || window.innerWidth);
      updatePinScreenPosition();
    }, 120);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            setContainerWidth(entry.contentRect.width);
            map.invalidateSize({ pan: false });
            updatePinScreenPosition();
          }
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      window.clearTimeout(syncSizeTimer);
      if (interactTimeoutRef.current) {
        window.clearTimeout(interactTimeoutRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
      contoursRef.current = null;
    };
  }, [updatePinScreenPosition]);

  // Render AQI Color Area Contour Polygons & City Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersRef.current;
    const contoursGroup = contoursRef.current;
    if (!map || !markersGroup || !contoursGroup) return;

    markersGroup.clearLayers();
    contoursGroup.clearLayers();

    const activeColor = ispuInfo.colorHex || '#10B981';

    // 1. Draw AQI Color Area organic contour layers if enabled
    if (appliedVisibility.aqiColorArea) {
      const outerCoords = createOrganicContourLatLngs(
        currentCity.lat,
        currentCity.lng,
        0.11,
        0.18,
        32
      );
      L.polygon(outerCoords, {
        color: activeColor,
        weight: 1.5,
        opacity: 0.65,
        fillColor: activeColor,
        fillOpacity: isDark ? 0.2 : 0.14,
        interactive: false,
      }).addTo(contoursGroup);

      const innerCoords = createOrganicContourLatLngs(
        currentCity.lat,
        currentCity.lng,
        0.06,
        0.1,
        28
      );
      L.polygon(innerCoords, {
        color: activeColor,
        weight: 2,
        opacity: 0.85,
        fillColor: activeColor,
        fillOpacity: isDark ? 0.32 : 0.24,
        interactive: false,
      }).addTo(contoursGroup);

      allSummaries.forEach((summary) => {
        if (
          Math.abs(summary.city.lat - currentCity.lat) < 0.03 &&
          Math.abs(summary.city.lng - currentCity.lng) < 0.03
        ) {
          return;
        }
        const neighborCoords = createOrganicContourLatLngs(
          summary.city.lat,
          summary.city.lng,
          0.075,
          0.105,
          20
        );
        L.polygon(neighborCoords, {
          color: summary.colorHex,
          weight: 1.2,
          opacity: 0.5,
          fillColor: summary.colorHex,
          fillOpacity: isDark ? 0.18 : 0.12,
          interactive: false,
        }).addTo(contoursGroup);
      });
    }

    // 2. Render Center Pin for Current Selected Location
    const bgCenterBadge = isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)';
    const textCenterBadge = isDark ? '#FFFFFF' : '#0F172A';

    const centerPinIcon = L.divIcon({
      className: 'center-city-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 120px; height: 64px; pointer-events: auto;">
          <div style="
            margin-bottom: 3px;
            padding: 2px 8px;
            border-radius: 9999px;
            background: ${bgCenterBadge};
            border: 1.5px solid ${activeColor};
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
            font-size: 10px;
            font-weight: 800;
            color: ${textCenterBadge};
            white-space: nowrap;
          ">${currentCity.name.replace('Kab. ', '').replace('Kota ', '')} • ${pollutants.us_aqi} AQI</div>
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: ${activeColor}; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="
              width: 30px;
              height: 30px;
              border-radius: 9999px;
              background-color: ${activeColor};
              border: 2.5px solid ${isDark ? '#0F172A' : '#FFFFFF'};
              box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        </div>
      `,
      iconSize: [120, 64],
      iconAnchor: [60, 46],
    });

    const centerMarker = L.marker([currentCity.lat, currentCity.lng], {
      icon: centerPinIcon,
      zIndexOffset: 1000,
    });
    centerMarker.on('click', () => {
      if (containerWidthRef.current < 640) {
        setMobileOrbitalBubbles((prev) => !prev);
      } else {
        setBubblesHiddenManually((prev) => !prev);
      }
    });
    markersGroup.addLayer(centerMarker);

    // 3. Render 13 Sulteng Kabupaten/Kota Interactive Pins
    allSummaries.forEach((summary) => {
      if (
        Math.abs(summary.city.lat - currentCity.lat) < 0.02 &&
        Math.abs(summary.city.lng - currentCity.lng) < 0.02
      ) {
        return;
      }

      const bgBadge = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)';
      const textBadge = isDark ? '#F1F5F9' : '#1E293B';

      const cityIcon = L.divIcon({
        className: 'sulteng-city-pin',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${bgBadge};
            backdrop-filter: blur(8px);
            border: 2px solid ${summary.colorHex};
            border-radius: 9999px;
            padding: 2px 7px 2px 3.5px;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
            cursor: pointer;
            white-space: nowrap;
            transition: transform 0.2s;
          ">
            <span style="
              width: 17px;
              height: 17px;
              border-radius: 9999px;
              background: ${summary.colorHex};
              color: white;
              font-size: 9px;
              font-weight: 800;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            ">${summary.us_aqi}</span>
            <span style="font-size: 10px; font-weight: 700; color: ${textBadge};">${summary.city.name.replace('Kab. ', '').replace('Kota ', '')}</span>
          </div>
        `,
        iconSize: [86, 24],
        iconAnchor: [43, 12],
      });

      const marker = L.marker([summary.city.lat, summary.city.lng], { icon: cityIcon });
      marker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        onSelectCity(summary.city);
      });
      markersGroup.addLayer(marker);
    });

    // 4. User GPS marker if available
    if (userLocation) {
      const gpsIcon = L.divIcon({
        className: 'user-gps-pin',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            border-radius: 9999px;
            background-color: #4F46E5;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 14px rgba(79, 70, 229, 0.6);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: gpsIcon })
        .bindTooltip('Titik GPS Perangkat Anda', { direction: 'top' })
        .addTo(markersGroup);
    }

    updatePinScreenPosition();
  }, [
    allSummaries,
    appliedVisibility.aqiColorArea,
    currentCity.id,
    currentCity.lat,
    currentCity.lng,
    currentCity.name,
    isDark,
    ispuInfo.colorHex,
    onSelectCity,
    pollutants.us_aqi,
    updatePinScreenPosition,
    userLocation,
  ]);

  // Smoothly pan/fly to selected city ONLY when city coordinates actually change
  const prevCoordsRef = useRef<{ lat: number; lng: number }>({
    lat: currentCity.lat,
    lng: currentCity.lng,
  });
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const dLat = Math.abs(prevCoordsRef.current.lat - currentCity.lat);
    const dLng = Math.abs(prevCoordsRef.current.lng - currentCity.lng);
    if (dLat > 0.0001 || dLng > 0.0001) {
      prevCoordsRef.current = { lat: currentCity.lat, lng: currentCity.lng };
      const currentZoom = map.getZoom();
      const minTargetZoom = window.innerWidth < 640 ? 10 : 11;
      const targetZoom = currentZoom < 9 ? minTargetZoom : currentZoom;
      map.flyTo([currentCity.lat, currentCity.lng], targetZoom, {
        duration: 0.85,
      });
    }
  }, [currentCity.lat, currentCity.lng]);

  const togglePollutant = (key: keyof PollutantVisibility) => {
    setDraftVisibility((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setAppliedVisibility(updated);
      return updated;
    });
  };

  const toggleAllPollutants = () => {
    const anyOn =
      draftVisibility.pm2_5 ||
      draftVisibility.pm10 ||
      draftVisibility.o3 ||
      draftVisibility.no2 ||
      draftVisibility.co;
    const nextState = !anyOn;
    const updated: PollutantVisibility = {
      ...draftVisibility,
      pm2_5: nextState,
      pm10: nextState,
      o3: nextState,
      no2: nextState,
      co: false,
    };
    setDraftVisibility(updated);
    setAppliedVisibility(updated);
  };

  const handleApplyOptions = () => {
    setAppliedVisibility({ ...draftVisibility });
    if (containerWidth < 640) {
      setViewOptionsOpen(false);
    }
  };

  const handleResetOptions = () => {
    const defaults: PollutantVisibility = {
      pm2_5: true,
      pm10: true,
      o3: true,
      no2: true,
      co: false,
      aqiColorArea: true,
    };
    setDraftVisibility(defaults);
    setAppliedVisibility(defaults);
    setBubblesHiddenManually(false);
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleZoomWholeSulteng = () => {
    mapInstanceRef.current?.flyTo([-1.15, 121.2], containerWidth < 640 ? 6 : 7, {
      duration: 0.9,
    });
  };

  const pm25Pct = getPollutantPercentage('pm2_5', pollutants.pm2_5);
  const pm10Pct = getPollutantPercentage('pm10', pollutants.pm10);
  const o3Pct = getPollutantPercentage('o3', pollutants.ozone);
  const no2Pct = getPollutantPercentage('no2', pollutants.nitrogen_dioxide);
  const coPct = getPollutantPercentage('co', pollutants.carbon_monoxide);

  const isMobileScreen = containerWidth < 640;

  // On desktop, show orbital bubbles unless hidden manually. On mobile, show slim bottom strip by default unless mobileOrbitalBubbles is toggled on!
  const shouldShowOrbitalBubbles =
    !isMapInteracting &&
    !loading &&
    !bubblesHiddenManually &&
    mapZoom >= 9 &&
    pinPixelPos !== null &&
    (!isMobileScreen || mobileOrbitalBubbles);

  const baseZoomScale =
    mapZoom <= 9 ? 0.76 : mapZoom === 10 ? 0.88 : mapZoom === 11 ? 0.96 : 1.02;

  const responsiveOrbitFactor = isMobileScreen ? 0.58 : 1;
  const responsiveSizeFactor = isMobileScreen ? 0.68 : 1;

  const bubbleItems = [
    {
      id: 'pm2_5',
      visible: appliedVisibility.pm2_5,
      label: 'PM2.5',
      pct: pm25Pct,
      value: pollutants.pm2_5.toFixed(1),
      fullValue: pollutants.pm2_5.toFixed(2),
      sizePx: Math.round(138 * responsiveSizeFactor),
      offsetX: 124 * responsiveOrbitFactor,
      offsetY: 26 * responsiveOrbitFactor,
      delayMs: 120,
      iconSize: (isMobileScreen ? 'sm' : 'lg') as 'sm' | 'md' | 'lg',
      textClass: isMobileScreen ? 'text-sm' : 'text-2xl',
      color: getAccuWeatherAQIColorHex(pm25Pct),
    },
    {
      id: 'pm10',
      visible: appliedVisibility.pm10,
      label: 'PM10',
      pct: pm10Pct,
      value: pollutants.pm10.toFixed(1),
      fullValue: pollutants.pm10.toFixed(2),
      sizePx: Math.round(102 * responsiveSizeFactor),
      offsetX: -72 * responsiveOrbitFactor,
      offsetY: 78 * responsiveOrbitFactor,
      delayMs: 80,
      iconSize: 'sm' as const,
      textClass: isMobileScreen ? 'text-xs' : 'text-lg',
      color: getAccuWeatherAQIColorHex(pm10Pct),
    },
    {
      id: 'o3',
      visible: appliedVisibility.o3,
      label: 'O3',
      pct: o3Pct,
      value: pollutants.ozone.toFixed(1),
      fullValue: pollutants.ozone.toFixed(2),
      sizePx: Math.round(108 * responsiveSizeFactor),
      offsetX: -120 * responsiveOrbitFactor,
      offsetY: -72 * responsiveOrbitFactor,
      delayMs: 0,
      iconSize: (isMobileScreen ? 'sm' : 'md') as 'sm' | 'md' | 'lg',
      textClass: isMobileScreen ? 'text-xs' : 'text-xl',
      color: getAccuWeatherAQIColorHex(o3Pct),
    },
    {
      id: 'no2',
      visible: appliedVisibility.no2,
      label: 'NO2',
      pct: no2Pct,
      value: pollutants.nitrogen_dioxide.toFixed(1),
      fullValue: pollutants.nitrogen_dioxide.toFixed(2),
      sizePx: Math.round(94 * responsiveSizeFactor),
      offsetX: 14 * responsiveOrbitFactor,
      offsetY: -106 * responsiveOrbitFactor,
      delayMs: 40,
      iconSize: 'sm' as const,
      textClass: isMobileScreen ? 'text-xs' : 'text-lg',
      color: getAccuWeatherAQIColorHex(no2Pct),
    },
    {
      id: 'co',
      visible: appliedVisibility.co,
      label: 'CO',
      pct: coPct,
      value: pollutants.carbon_monoxide.toFixed(0),
      fullValue: pollutants.carbon_monoxide.toFixed(1),
      sizePx: Math.round(94 * responsiveSizeFactor),
      offsetX: 120 * responsiveOrbitFactor,
      offsetY: -90 * responsiveOrbitFactor,
      delayMs: 150,
      iconSize: 'sm' as const,
      textClass: isMobileScreen ? 'text-xs' : 'text-base',
      color: getAccuWeatherAQIColorHex(coPct),
    },
  ];

  return (
    <div className="relative flex-1 w-full min-h-[360px] h-full overflow-hidden bg-slate-200 dark:bg-[#0B1120] select-none theme-transition">
      {/* Leaflet OpenStreetMap Canvas (Strictly Bounded to Indonesia) */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full z-0 cursor-crosshair"
      />

      {/* =====================================================================
          GEO-ANCHORED, ZOOM-ANIMATED ORBITAL POLLUTANT BUBBLES
         ===================================================================== */}
      {pinPixelPos && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {bubbleItems.map((b) => {
            if (!b.visible) return null;

            const tx = shouldShowOrbitalBubbles ? b.offsetX * baseZoomScale : 0;
            const ty = shouldShowOrbitalBubbles ? b.offsetY * baseZoomScale : 0;
            const sc = shouldShowOrbitalBubbles ? baseZoomScale : 0.15;

            return (
              <button
                key={b.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBubbleInfo(selectedBubbleInfo === b.id ? null : b.id);
                }}
                style={{
                  left: `${pinPixelPos.x}px`,
                  top: `${pinPixelPos.y}px`,
                  width: `${b.sizePx}px`,
                  height: `${b.sizePx}px`,
                  transform: `translate(calc(-50% + ${tx.toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px)) scale(${sc.toFixed(2)})`,
                  opacity: shouldShowOrbitalBubbles ? 1 : 0,
                  transitionProperty: 'transform, opacity, background-color, border-color',
                  transitionDuration: shouldShowOrbitalBubbles ? '420ms' : '220ms',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  transitionDelay: shouldShowOrbitalBubbles ? `${b.delayMs}ms` : '0ms',
                }}
                className={`${
                  shouldShowOrbitalBubbles ? 'pointer-events-auto' : 'pointer-events-none'
                } absolute flex flex-col items-center justify-center rounded-full border border-white/95 dark:border-slate-700/90 bg-gradient-to-b from-white/92 via-white/85 to-white/75 dark:from-slate-900/92 dark:via-slate-900/85 dark:to-slate-950/80 backdrop-blur-md shadow-[0_14px_32px_rgba(15,23,42,0.15)] dark:shadow-[0_14px_32px_rgba(0,0,0,0.45)] hover:brightness-105 cursor-pointer`}
              >
                <MoleculeClusterIcon color={b.color} size={b.iconSize} />
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-none">
                    {b.label}
                  </span>
                  <span className="rounded bg-slate-200/85 dark:bg-slate-800 px-1 py-0.2 text-[8px] sm:text-[9px] font-bold text-slate-600 dark:text-slate-300 leading-none">
                    {b.pct} AQI
                  </span>
                </div>
                <div
                  className={`mt-0.5 ${b.textClass} font-extrabold tracking-tight text-slate-900 dark:text-white leading-none`}
                >
                  {b.fullValue}
                </div>
                <span className="mt-0.5 text-[8px] sm:text-[9px] font-medium text-slate-400 dark:text-slate-500 leading-none">
                  µg/m³
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          MOBILE SLIM FLOATING POLLUTANT CHIP BAR (Unobstructed Map View on Mobile!)
         ===================================================================== */}
      <div className="sm:hidden absolute bottom-2.5 left-2.5 right-13 z-20 flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
        {bubbleItems
          .filter((b) => b.visible)
          .map((b) => {
            const isSelected = selectedBubbleInfo === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBubbleInfo(isSelected ? null : b.id)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] shadow-md backdrop-blur-md shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-white/90 dark:border-slate-700/90 bg-white/92 dark:bg-slate-900/92 text-slate-800 dark:text-slate-100'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#FFFFFF' : b.color }}
                />
                <span className="font-bold">{b.label}</span>
                <span className="font-extrabold">{b.value}</span>
              </button>
            );
          })}
      </div>

      {/* Top-Center Interactive Hint Pill (Desktop Only) */}
      <div className="pointer-events-none absolute top-3.5 left-1/2 -translate-x-1/2 z-20 hidden xl:flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-[0_6px_20px_rgba(15,23,42,0.08)] backdrop-blur-md theme-transition">
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Memuat data atmosfer titik koordinat...</span>
          </>
        ) : mapZoom < 9 ? (
          <span>
            Tampilan Provinsi: Gelembung polutan disembunyikan otomatis • Klik wilayah atau perbesar peta untuk detail
          </span>
        ) : (
          <>
            <MousePointerClick className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              Klik titik mana saja di peta wilayah Sulawesi Tengah untuk memeriksa kualitas udara lokasi tersebut
            </span>
          </>
        )}
      </div>

      {/* Outside Sulawesi Tengah Warning Alert Toast */}
      {outsideWarning && (
        <div className="absolute top-3 sm:top-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-40 flex items-center justify-between gap-2.5 rounded-2xl border border-amber-300/80 dark:border-amber-600/60 bg-amber-50/95 dark:bg-amber-950/95 p-3 text-amber-900 dark:text-amber-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold leading-snug">
              {outsideWarning}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOutsideWarning(null)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-100 p-1 font-bold text-xs shrink-0 cursor-pointer"
            aria-label="Tutup peringatan batas wilayah"
          >
            ✕
          </button>
        </div>
      )}

      {/* Popover Info when a Pollutant Bubble or Chip is clicked */}
      {selectedBubbleInfo && (
        <div className="absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 z-30 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md flex items-center gap-3 text-xs text-slate-700 dark:text-slate-200 max-w-md w-[92%] theme-transition">
          <div className="flex-1 text-[11px] sm:text-xs leading-relaxed">
            {selectedBubbleInfo === 'pm2_5' && (
              <p>
                <strong>PM2.5 ({pollutants.pm2_5.toFixed(2)} µg/m³):</strong> Partikel halus kabut asap karhutla (&lt;2.5 mikron). Batas aman harian KLHK: 15.5 µg/m³.
              </p>
            )}
            {selectedBubbleInfo === 'pm10' && (
              <p>
                <strong>PM10 ({pollutants.pm10.toFixed(2)} µg/m³):</strong> Partikel debu & abu sisa pembakaran lahan (&lt;10 mikron). Batas aman ISPU: 50 µg/m³.
              </p>
            )}
            {selectedBubbleInfo === 'o3' && (
              <p>
                <strong>Ozon Permukaan O3 ({pollutants.ozone.toFixed(2)} µg/m³):</strong> Gas reaktif yang meningkat saat cuaca terik dan asap terpapar sinar matahari.
              </p>
            )}
            {selectedBubbleInfo === 'no2' && (
              <p>
                <strong>Nitrogen Dioksida NO2 ({pollutants.nitrogen_dioxide.toFixed(2)} µg/m³):</strong> Gas hasil pembakaran biomassa dan emisi transportasi di {currentCity.name}.
              </p>
            )}
            {selectedBubbleInfo === 'co' && (
              <p>
                <strong>Karbon Monoksida CO ({pollutants.carbon_monoxide.toFixed(1)} µg/m³):</strong> Indikator utama pembakaran hutan dan lahan gambut/semak.
              </p>
            )}
          </div>
          <button
            onClick={() => setSelectedBubbleInfo(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold px-1.5 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          TOP-RIGHT CONTROLS (Map Layer Options Button)
         ===================================================================== */}
      <div className="absolute right-2.5 sm:right-5 top-2.5 sm:top-4 z-30 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setViewOptionsOpen(!viewOptionsOpen)}
          title="Opsi Tampilan Peta & Polutan"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur-md transition-all cursor-pointer ${
            viewOptionsOpen
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayerControlIcon className="h-4 w-4" />
        </button>
      </div>

      {/* =====================================================================
          FLOATING "OPSI TAMPILAN" PANEL (Neatly Under Top-Right Layer Button)
         ===================================================================== */}
      {viewOptionsOpen && (
        <div className="absolute right-2.5 sm:right-5 top-13 sm:top-15 z-30 w-[240px] max-w-[calc(100vw-24px)] max-h-[calc(100%-80px)] overflow-y-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)] backdrop-blur-md theme-transition">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <LayerControlIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold tracking-tight">Opsi Tampilan Peta</span>
            </div>
            <button
              onClick={() => setViewOptionsOpen(false)}
              title="Sembunyikan panel"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Pollutant Collapsible Section */}
          <div className="py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between py-1">
              <button
                type="button"
                onClick={() => setPollutantMenuExpanded(!pollutantMenuExpanded)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                {pollutantMenuExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>Parameter Polutan</span>
              </button>
              <button
                type="button"
                onClick={toggleAllPollutants}
                title="Tampilkan / Sembunyikan Semua Polutan"
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
              >
                {draftVisibility.pm2_5 || draftVisibility.pm10 || draftVisibility.o3 || draftVisibility.no2 ? (
                  <VisibilityOnIcon className="h-4 w-4" />
                ) : (
                  <VisibilityOffIcon className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>

            {pollutantMenuExpanded && (
              <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-1.5 pl-2 sm:pl-3">
                {(
                  [
                    { key: 'pm2_5', label: 'PM2.5 (Asap Halus)' },
                    { key: 'pm10', label: 'PM10 (Debu & Abu)' },
                    { key: 'o3', label: 'O3 (Ozon)' },
                    { key: 'no2', label: 'NO2 (Nitrogen)' },
                    { key: 'co', label: 'CO (Asap Karhutla)' },
                  ] as const
                ).map((item) => {
                  const isVisible = draftVisibility[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => togglePollutant(item.key)}
                      className="flex w-full items-center justify-between text-left py-0.5 group cursor-pointer"
                    >
                      <span
                        className={`text-[11px] sm:text-xs transition-colors truncate pr-1 ${
                          isVisible
                            ? 'font-semibold text-slate-800 dark:text-slate-200'
                            : 'font-medium text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.label}
                      </span>
                      {isVisible ? (
                        <VisibilityOnIcon className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <VisibilityOffIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* AQI Color Area Toggle */}
          <div className="py-2 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => togglePollutant('aqiColorArea')}
              className="flex w-full items-center justify-between text-left cursor-pointer"
            >
              <span
                className={`text-xs ${
                  draftVisibility.aqiColorArea
                    ? 'font-bold text-slate-800 dark:text-slate-100'
                    : 'font-medium text-slate-400 dark:text-slate-500'
                }`}
              >
                Zona Warna Indeks
              </span>
              {draftVisibility.aqiColorArea ? (
                <VisibilityOnIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <VisibilityOffIcon className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              )}
            </button>

            {/* Mobile Orbital Bubbles Toggle */}
            <button
              type="button"
              onClick={() => setMobileOrbitalBubbles(!mobileOrbitalBubbles)}
              className="flex sm:hidden w-full items-center justify-between text-left cursor-pointer"
            >
              <span
                className={`text-xs ${
                  mobileOrbitalBubbles
                    ? 'font-bold text-slate-800 dark:text-slate-100'
                    : 'font-medium text-slate-400 dark:text-slate-500'
                }`}
              >
                Gelembung Melingkar di Peta
              </span>
              {mobileOrbitalBubbles ? (
                <VisibilityOnIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <VisibilityOffIcon className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              )}
            </button>
          </div>

          {/* Reset & Apply Buttons in Bahasa Indonesia */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetOptions}
              className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Atur Ulang
            </button>
            <button
              type="button"
              onClick={handleApplyOptions}
              className="flex-1 rounded-full bg-indigo-600 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          BOTTOM-RIGHT ZOOM & FULLSCREEN MAP CONTROLS
         ===================================================================== */}
      <div className="absolute bottom-2.5 sm:bottom-5 right-2.5 sm:right-5 z-20 flex flex-col gap-1.5 sm:gap-2">
        {onToggleMaximizeMap && (
          <button
            type="button"
            onClick={onToggleMaximizeMap}
            title={isMapMaximized ? 'Tampilkan Panel Informasi' : 'Perluas Peta Layar Penuh'}
            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border shadow-[0_6px_16px_rgba(15,23,42,0.14)] transition-colors cursor-pointer ${
              isMapMaximized
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            {isMapMaximized ? (
              <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={handleZoomWholeSulteng}
          title="Fokus Peta Provinsi Sulawesi Tengah"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-[0_6px_16px_rgba(15,23,42,0.14)] hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          title="Perbesar Peta"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-[0_6px_16px_rgba(15,23,42,0.14)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.2]" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Perkecil Peta"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-[0_6px_16px_rgba(15,23,42,0.14)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};

export const AirQualityMap = React.memo(AirQualityMapComponent);
