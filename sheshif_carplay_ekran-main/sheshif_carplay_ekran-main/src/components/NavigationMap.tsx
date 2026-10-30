import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Search,
  Zap,
  Fuel,
  Coffee,
  Navigation2,
  Compass,
  Plus,
  Minus,
  CheckCircle2,
  ParkingCircle,
  AlertCircle,
  Layers,
  Volume2,
} from 'lucide-react';
import { LocationPoint, NavigationState } from '../types/automotive';
import { INITIAL_CAR_LOCATION, POPULAR_DESTINATIONS } from '../data/mockData';
import { AUTOMOTIVE_DARK_MAP_STYLE } from '../styles/mapStyles';

interface NavigationMapProps {
  apiKey: string;
  carLocation: LocationPoint;
  setCarLocation: React.Dispatch<React.SetStateAction<LocationPoint>>;
  navigation: NavigationState;
  setNavigation: React.Dispatch<React.SetStateAction<NavigationState>>;
  currentSpeed: number;
}

// Inner helper component to manipulate map camera imperatively
const MapController: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
  tilt: number;
  heading: number;
}> = ({ center, zoom, tilt, heading }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
    if (typeof map.setTilt === 'function') {
      map.setTilt(tilt);
    }
    if (typeof map.setHeading === 'function') {
      map.setHeading(heading);
    }
  }, [map, center, zoom, tilt, heading]);

  return null;
};

// Route Polyline renderer component
const RouteRenderer: React.FC<{
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
}> = ({ origin, destination }) => {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!destination) {
      if (polyline) {
        polyline.setMap(null);
        setPolyline(null);
      }
      return;
    }

    // Generate intermediate waypoints for smooth automotive road curvature
    const midLat = (origin.lat + destination.lat) / 2 + 0.003;
    const midLng = (origin.lng + destination.lng) / 2 - 0.002;
    const path = [
      { lat: origin.lat, lng: origin.lng },
      { lat: midLat, lng: midLng },
      { lat: destination.lat, lng: destination.lng },
    ];

    if (polyline) {
      polyline.setPath(path);
      polyline.setMap(map);
    } else {
      const newLine = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#06b6d4', // Cyan navigation line
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map,
      });
      setPolyline(newLine);
    }

    return () => {
      if (polyline) {
        polyline.setMap(null);
      }
    };
  }, [map, origin, destination]);

  return null;
};

export const NavigationMap: React.FC<NavigationMapProps> = ({
  apiKey,
  carLocation,
  navigation,
  setNavigation,
  currentSpeed,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoi, setSelectedPoi] = useState<LocationPoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [zoomLevel, setZoomLevel] = useState(15);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: carLocation.lat,
    lng: carLocation.lng,
  });
  const [mapHeading, setMapHeading] = useState(35);
  const [hasMapError, setHasMapError] = useState(false);

  // Filter POIs
  const filteredPois = useMemo(() => {
    return POPULAR_DESTINATIONS.filter((poi) => {
      const matchesCategory =
        activeCategory === 'all' || poi.type === activeCategory;
      const matchesSearch =
        poi.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (poi.subtitle && poi.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Start Navigation to POI
  const startNavigation = useCallback((destination: LocationPoint) => {
    setSelectedPoi(null);
    setNavigation({
      isNavigating: true,
      destination,
      etaMinutes: Math.round((destination.distanceKm || 5) * 2.2),
      distanceRemainingKm: destination.distanceKm || 5.2,
      nextTurnMeters: 450,
      nextTurnInstruction: '450m sonra sağa dönün: TEM Maslak Bağlantısı',
      nextTurnAction: 'right',
      speedLimitKmH: 90,
    });
    setMapCenter({ lat: carLocation.lat, lng: carLocation.lng });
    setViewMode('3d');
    setZoomLevel(16);
  }, [carLocation, setNavigation]);

  // Cancel Navigation
  const stopNavigation = useCallback(() => {
    setNavigation((prev) => ({
      ...prev,
      isNavigating: false,
      destination: null,
    }));
  }, [setNavigation]);

  // Center on Vehicle
  const handleRecenter = () => {
    setMapCenter({ lat: carLocation.lat, lng: carLocation.lng });
    setZoomLevel(16);
  };

  const categories = [
    { id: 'all', label: 'Tümü', icon: Layers },
    { id: 'charger', label: '⚡ Şarj', icon: Zap },
    { id: 'fuel', label: '⛽ Yakıt', icon: Fuel },
    { id: 'cafe', label: '☕ Dinlenme', icon: Coffee },
    { id: 'parking', label: '🅿️ Otopark', icon: ParkingCircle },
  ];

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Google Maps Wrapper */}
      <APIProvider
        apiKey={apiKey}
        language="tr"
        region="TR"
        onLoad={() => setHasMapError(false)}
        onError={() => setHasMapError(true)}
      >
        <Map
          id="automotive-in-car-map"
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={{ lat: INITIAL_CAR_LOCATION.lat, lng: INITIAL_CAR_LOCATION.lng }}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={true}
          styles={AUTOMOTIVE_DARK_MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Map Camera State Controller */}
          <MapController
            center={mapCenter}
            zoom={zoomLevel}
            tilt={viewMode === '3d' ? 55 : 0}
            heading={viewMode === '3d' ? mapHeading : 0}
          />

          {/* Polyline Route */}
          <RouteRenderer
            origin={{ lat: carLocation.lat, lng: carLocation.lng }}
            destination={
              navigation.destination
                ? { lat: navigation.destination.lat, lng: navigation.destination.lng }
                : null
            }
          />

          {/* Vehicle Position Marker */}
          <AdvancedMarker
            position={{ lat: carLocation.lat, lng: carLocation.lng }}
            title="Aracınız"
          >
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
              {/* Radar pulse effect */}
              <div className="absolute w-14 h-14 rounded-full bg-cyan-500/20 animate-ping pointer-events-none" />
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
                <Navigation2
                  className="w-6 h-6 fill-white drop-shadow-md transition-transform"
                  style={{ transform: `rotate(${mapHeading}deg)` }}
                />
              </div>
            </div>
          </AdvancedMarker>

          {/* POI Markers */}
          {filteredPois.map((poi, idx) => {
            const isDestination = navigation.destination?.title === poi.title;
            return (
              <AdvancedMarker
                key={idx}
                position={{ lat: poi.lat, lng: poi.lng }}
                onClick={() => setSelectedPoi(poi)}
              >
                <div
                  className={`group relative flex items-center justify-center p-2 rounded-2xl shadow-lg border-2 transition-transform hover:scale-125 cursor-pointer ${
                    isDestination
                      ? 'bg-emerald-500 border-white text-slate-950 scale-110 shadow-emerald-500/50'
                      : poi.type === 'charger'
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-400'
                      : poi.type === 'fuel'
                      ? 'bg-amber-950/90 border-amber-400 text-amber-400'
                      : poi.type === 'cafe'
                      ? 'bg-orange-950/90 border-orange-400 text-orange-400'
                      : 'bg-blue-950/90 border-blue-400 text-blue-400'
                  }`}
                >
                  {poi.type === 'charger' && <Zap className="w-5 h-5 fill-current" />}
                  {poi.type === 'fuel' && <Fuel className="w-5 h-5" />}
                  {poi.type === 'cafe' && <Coffee className="w-5 h-5" />}
                  {poi.type === 'parking' && <ParkingCircle className="w-5 h-5" />}
                  {!poi.type && <Navigation2 className="w-5 h-5" />}

                  {/* Tooltip on hover */}
                  <span className="absolute -bottom-7 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {poi.title}
                  </span>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* InfoWindow for Selected POI */}
          {selectedPoi && (
            <InfoWindow
              position={{ lat: selectedPoi.lat, lng: selectedPoi.lng }}
              onCloseClick={() => setSelectedPoi(null)}
            >
              <div className="p-2 min-w-[220px] max-w-[280px] bg-slate-900 text-slate-100 rounded-xl text-left font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    {selectedPoi.type === 'charger'
                      ? '⚡ Yüksek Hızlı Şarj'
                      : selectedPoi.type === 'fuel'
                      ? '⛽ Akaryakıt'
                      : selectedPoi.type === 'cafe'
                      ? '☕ Dinlenme / Cafe'
                      : '🅿️ Otopark'}
                  </span>
                  {selectedPoi.rating && (
                    <span className="text-[11px] font-bold text-amber-400">
                      ★ {selectedPoi.rating}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                  {selectedPoi.title}
                </h4>
                {selectedPoi.subtitle && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedPoi.subtitle}
                  </p>
                )}

                {selectedPoi.details && (
                  <div className="mt-2 text-[10px] text-slate-300 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
                    {selectedPoi.details}
                  </div>
                )}

                {selectedPoi.availableStalls && (
                  <div className="mt-1.5 flex items-center space-x-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedPoi.availableStalls}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedPoi.distanceKm} km uzakta
                  </span>
                  <button
                    onClick={() => startNavigation(selectedPoi)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-cyan-950 transition-colors flex items-center space-x-1"
                  >
                    <Navigation2 className="w-3.5 h-3.5 fill-current" />
                    <span>Navigasyon</span>
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Notice if map key has an issue */}
      {hasMapError && (
        <div className="absolute top-16 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-amber-950/90 border border-amber-500/50 text-amber-200 p-3 rounded-2xl backdrop-blur-md z-40 text-xs shadow-2xl flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Harita Uyarısı</div>
            <div>
              Google Maps API anahtarı doğrulanamadı veya yetki kısıtı mevcut. Araç içi ekran navigasyon simülasyon modu aktif.
            </div>
          </div>
        </div>
      )}

      {/* Floating Search & Filter Bar (Automotive Floating Card) */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-[420px] z-20 flex flex-col space-y-2 pointer-events-auto">
        {/* Search Input Box */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xl">
          <Search className="w-5 h-5 text-cyan-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nereye gitmek istiyorsunuz? (örn: Vadi İstanbul)"
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded-full bg-slate-800"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all backdrop-blur-md shadow-md ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-cyan-950 font-bold'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Turn-by-Turn Guidance HUD Card (Active Navigation Mode) */}
      {navigation.isNavigating && navigation.destination && (
        <div className="absolute top-28 left-4 z-20 w-80 bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl p-4 shadow-2xl shadow-cyan-950/60 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start space-x-3">
            {/* Maneuver Arrow icon */}
            <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/40">
              <Navigation2 className="w-7 h-7 fill-current transform rotate-45" />
            </div>

            <div className="flex-1">
              <div className="flex items-baseline space-x-1">
                <span className="font-mono text-2xl font-black text-cyan-400">
                  {navigation.nextTurnMeters}
                </span>
                <span className="text-xs font-bold text-cyan-300">metre sonra</span>
              </div>
              <div className="text-sm font-semibold text-slate-100 leading-tight mt-0.5">
                {navigation.nextTurnInstruction}
              </div>
            </div>
          </div>

          {/* Trip Summary footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Varış: </span>
              <span className="text-white font-bold">14:48</span>
              <span className="text-slate-400 ml-1">({navigation.etaMinutes} dk)</span>
            </div>
            <div className="text-cyan-400 font-bold">
              {navigation.distanceRemainingKm} km
            </div>
            <button
              onClick={stopNavigation}
              className="text-rose-400 hover:text-rose-300 font-bold text-[11px] px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/60"
            >
              Rotayı Sonlandır
            </button>
          </div>
        </div>
      )}

      {/* Right Controls Dock: Zoom, 3D/2D, Re-center, Speed Limit */}
      <div className="absolute right-4 bottom-6 z-20 flex flex-col items-center space-y-2.5 pointer-events-auto">
        {/* Speed Limit Indicator Circle (European Traffic Sign) */}
        <div className="w-12 h-12 rounded-full bg-white border-4 border-rose-600 flex flex-col items-center justify-center text-slate-950 shadow-xl font-sans">
          <span className="text-[9px] font-black uppercase leading-none tracking-tighter">
            HIZ LİMİTİ
          </span>
          <span className="text-base font-black leading-none mt-0.5">
            {navigation.speedLimitKmH}
          </span>
        </div>

        {/* 3D / 2D Perspective Toggle */}
        <button
          onClick={() => {
            setViewMode(viewMode === '3d' ? '2d' : '3d');
            setMapHeading((prev) => (prev + 30) % 360);
          }}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xl backdrop-blur-xl transition-all ${
            viewMode === '3d'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
          title="3D / 2D Perspektif Değiştir"
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => setZoomLevel((z) => Math.min(20, z + 1))}
          className="w-11 h-11 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 shadow-xl flex items-center justify-center transition-all"
          title="Yakınlaştır"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => setZoomLevel((z) => Math.max(10, z - 1))}
          className="w-11 h-11 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 shadow-xl flex items-center justify-center transition-all"
          title="Uzaklaştır"
        >
          <Minus className="w-5 h-5" />
        </button>

        {/* Recenter on Car */}
        <button
          onClick={handleRecenter}
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-900/60 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          title="Aracı Ortala"
        >
          <Navigation2 className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Bottom Center Floating Destination Quick Suggestion Bar */}
      {!navigation.isNavigating && (
        <div className="absolute bottom-4 left-4 right-16 md:right-auto md:w-[480px] z-10 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-3 shadow-2xl flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">
                  Önerilen: Tesla Supercharger Maslak
                </div>
                <div className="text-[11px] text-slate-400">
                  3.8 km • 6 Boş Soket • 250 kW
                </div>
              </div>
            </div>

            <button
              onClick={() => startNavigation(POPULAR_DESTINATIONS[0])}
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shrink-0 transition-transform active:scale-95"
            >
              Rota Oluştur
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
