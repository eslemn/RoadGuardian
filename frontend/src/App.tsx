/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavTab, Gear, VehicleTelemetry, ClimateState, NavigationState, LocationPoint, MediaTrack } from './types/automotive';
import { INITIAL_CAR_LOCATION, MOCK_PLAYLIST } from './data/mockData';
import { AndroidAutoScreen } from './components/AndroidAutoScreen';
import { TopStatusBar } from './components/TopStatusBar';
import { SideDock } from './components/SideDock';
import { BottomClimateBar } from './components/BottomClimateBar';
import { NavigationMap } from './components/NavigationMap';
import { CockpitDashboard } from './components/CockpitDashboard';
import { MediaApp } from './components/MediaApp';
import { ClimateApp } from './components/ClimateApp';
import { VehicleControlsApp } from './components/VehicleControlsApp';
import { PhoneApp } from './components/PhoneApp';
import { SettingsApp } from './components/SettingsApp';
import { ADASApp } from './components/ADASApp';
import { useADASVision } from './hooks/useADASVision';
import { LayoutGrid, Gauge } from 'lucide-react';

export default function App() {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyDk3hrjoI5NA7jPxiHP1kurOJuZJtTimyo';

  // Display Mode: 'android-auto' (Exact match to user's Coolwalk screenshot) vs 'full-cockpit' (Vehicle telemetry & controls)
  const [displayMode, setDisplayMode] = useState<'android-auto' | 'full-cockpit'>('android-auto');

  // ADAS Computer Vision & Safety System
  const {
    telemetry: adasTelemetry,
    isConnected: adasConnected,
    isCameraModalOpen,
    setIsCameraModalOpen,
    isMuted: isADASMuted,
    setIsMuted: setIsADASMuted,
    alertDismissed: isADASAlertDismissed,
    dismissAlert: dismissADASAlert,
    updateSettings: updateADASSettings,
    togglePause: toggleADASPause,
    restartVideo: restartADASVideo,
    switchSource: switchADASSource,
    setConfidence: setADASConfidence,
  } = useADASVision();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>('map');

  // Hazard light toggle
  const [isHazardOn, setIsHazardOn] = useState(false);

  // Vehicle Telemetry
  const [telemetry, setTelemetry] = useState<VehicleTelemetry>({
    speed: 68,
    gear: 'D',
    batteryPercent: 84,
    rangeKm: 412,
    powerKw: 38,
    driveMode: 'KONFOR',
    odometerKm: 24860,
    tirePressuresBar: {
      frontLeft: 2.9,
      frontRight: 2.9,
      rearLeft: 2.8,
      rearRight: 2.8,
    },
    doors: {
      driver: false,
      passenger: false,
      frunk: false,
      trunk: false,
      chargePort: false,
    },
    lights: 'auto',
    sentryMode: false,
    locked: true,
    autopilotActive: true,
  });

  // Navigation State
  const [carLocation, setCarLocation] = useState<LocationPoint>(INITIAL_CAR_LOCATION);
  const [navigation, setNavigation] = useState<NavigationState>({
    isNavigating: true,
    destination: {
      lat: 41.1118,
      lng: 29.0205,
      title: 'Central Express Way',
      subtitle: 'Maslak TEM Bağlantısı',
      type: 'charger',
      distanceKm: 8.0,
    },
    etaMinutes: 24,
    distanceRemainingKm: 8.0,
    nextTurnMeters: 300,
    nextTurnInstruction: '1000 ft sonra sağa dönün: Central Express Way',
    nextTurnAction: 'right',
    speedLimitKmH: 90,
  });

  // Climate State
  const [climate, setClimate] = useState<ClimateState>({
    driverTemp: 21.5,
    passengerTemp: 22.0,
    acOn: true,
    autoFan: true,
    fanSpeed: 2,
    recirculate: false,
    frontDefrost: false,
    rearDefrost: false,
    driverSeatHeater: 1,
    passengerSeatHeater: 0,
    steeringWheelHeater: false,
    airFlowDirection: 'face',
  });

  // Media State
  const [currentTrack, setCurrentTrack] = useState<MediaTrack>({
    id: '1',
    title: 'You got to listen',
    artist: 'Michael Evans',
    album: 'High Fidelity Sound',
    durationSeconds: 218,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(65);

  // Ambient Lighting Color
  const [ambientColor, setAmbientColor] = useState<string>('#06b6d4');

  // Realistic Driving Speed Dynamics
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        if (prev.gear === 'P') return { ...prev, speed: 0, powerKw: 0 };
        if (prev.gear === 'D') {
          const jitter = (Math.random() - 0.5) * 3;
          const targetSpeed = prev.autopilotActive ? 70 : prev.speed;
          const newSpeed = Math.max(0, Math.min(220, Math.round(targetSpeed + jitter)));
          const power = Math.round(newSpeed * 0.55 + (Math.random() - 0.5) * 5);
          return { ...prev, speed: newSpeed, powerKw: power };
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGearChange = (gear: Gear) => {
    setTelemetry((prev) => ({
      ...prev,
      gear,
      speed: gear === 'P' ? 0 : prev.speed,
    }));
  };

  const handleToggleLock = () => {
    setTelemetry((prev) => ({ ...prev, locked: !prev.locked }));
  };

  const handleToggleSentry = () => {
    setTelemetry((prev) => ({ ...prev, sentryMode: !prev.sentryMode }));
  };

  const handleUpdateClimate = (updates: Partial<ClimateState>) => {
    setClimate((prev) => ({ ...prev, ...updates }));
  };

  const handleNextTrack = () => {
    const idx = MOCK_PLAYLIST.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (idx + 1) % MOCK_PLAYLIST.length;
    setCurrentTrack(MOCK_PLAYLIST[nextIdx]);
  };

  const handlePrevTrack = () => {
    const idx = MOCK_PLAYLIST.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (idx - 1 + MOCK_PLAYLIST.length) % MOCK_PLAYLIST.length;
    setCurrentTrack(MOCK_PLAYLIST[prevIdx]);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-neutral-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Floating System View Switcher (Discreet pill at bottom-right) */}
      <div className="fixed bottom-3 right-4 z-50 flex items-center bg-black/85 backdrop-blur-xl border border-neutral-700/80 p-1 rounded-2xl shadow-2xl space-x-1">
        <button
          onClick={() => setDisplayMode('android-auto')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
            displayMode === 'android-auto'
              ? 'bg-sky-500 text-neutral-950 shadow-md shadow-sky-950'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Android Auto Coolwalk</span>
        </button>

        <button
          onClick={() => setDisplayMode('full-cockpit')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
            displayMode === 'full-cockpit'
              ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-950'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Kokpit & Araç Kontrolleri</span>
        </button>
      </div>

      {/* 1. Android Auto Coolwalk Screen (Primary mode matching user image with embedded ADAS Camera & Controls) */}
      {displayMode === 'android-auto' ? (
        <AndroidAutoScreen
          apiKey={apiKey}
          adasTelemetry={adasTelemetry}
          adasConnected={adasConnected}
          onTogglePause={toggleADASPause}
          onRestartVideo={restartADASVideo}
          onSwitchSource={switchADASSource}
          onSetConfidence={setADASConfidence}
        />
      ) : (
        /* 2. Full In-Vehicle Infotainment Cockpit (Alternative mode) */
        <div
          className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden"
          style={{ boxShadow: `inset 0 0 50px ${ambientColor}22` }}
        >
          <TopStatusBar
            telemetry={telemetry}
            onGearChange={handleGearChange}
            onToggleLock={handleToggleLock}
            onToggleSentry={handleToggleSentry}
          />

          <div className="flex-1 flex overflow-hidden relative">
            <SideDock
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isHazardOn={isHazardOn}
              onToggleHazard={() => setIsHazardOn(!isHazardOn)}
            />

            <main className="flex-1 relative h-full overflow-hidden bg-slate-950">
              {activeTab === 'map' && (
                <NavigationMap
                  apiKey={apiKey}
                  carLocation={carLocation}
                  setCarLocation={setCarLocation}
                  navigation={navigation}
                  setNavigation={setNavigation}
                  currentSpeed={telemetry.speed}
                />
              )}

              {activeTab === 'cockpit' && (
                <CockpitDashboard
                  telemetry={telemetry}
                  setTelemetry={setTelemetry}
                  navigation={navigation}
                  onOpenMap={() => setActiveTab('map')}
                  adasTelemetry={adasTelemetry}
                  onOpenADAS={() => setActiveTab('adas')}
                />
              )}

              {activeTab === 'adas' && (
                <ADASApp
                  telemetry={adasTelemetry}
                  isConnected={adasConnected}
                  onUpdateSettings={updateADASSettings}
                  onTogglePause={toggleADASPause}
                />
              )}

              {activeTab === 'music' && (
                <MediaApp
                  currentTrack={currentTrack}
                  setCurrentTrack={setCurrentTrack}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onNextTrack={handleNextTrack}
                  onPrevTrack={handlePrevTrack}
                  volume={volume}
                  onChangeVolume={setVolume}
                />
              )}

              {activeTab === 'climate' && (
                <ClimateApp
                  climate={climate}
                  onChangeClimate={handleUpdateClimate}
                />
              )}

              {activeTab === 'vehicle' && (
                <VehicleControlsApp
                  telemetry={telemetry}
                  setTelemetry={setTelemetry}
                />
              )}

              {activeTab === 'phone' && <PhoneApp />}

              {activeTab === 'settings' && (
                <SettingsApp
                  ambientColor={ambientColor}
                  setAmbientColor={setAmbientColor}
                  apiKey={apiKey}
                />
              )}
            </main>
          </div>

          <BottomClimateBar
            climate={climate}
            onChangeClimate={handleUpdateClimate}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onNextTrack={handleNextTrack}
            volume={volume}
            onChangeVolume={setVolume}
            onOpenClimateApp={() => setActiveTab('climate')}
          />
        </div>
      )}
    </div>
  );
}
