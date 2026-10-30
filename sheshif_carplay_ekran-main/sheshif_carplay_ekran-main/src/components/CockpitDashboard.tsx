import React from 'react';
import {
  Gauge,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Disc,
  Compass,
  ArrowUp,
  Sliders,
  Car,
} from 'lucide-react';
import { DriveMode, NavigationState, VehicleTelemetry } from '../types/automotive';
import { ADASTelemetry } from '../types/adas';

interface CockpitDashboardProps {
  telemetry: VehicleTelemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<VehicleTelemetry>>;
  navigation: NavigationState;
  onOpenMap: () => void;
  adasTelemetry?: ADASTelemetry;
  onOpenADAS?: () => void;
}

export const CockpitDashboard: React.FC<CockpitDashboardProps> = ({
  telemetry,
  setTelemetry,
  navigation,
  onOpenMap,
  adasTelemetry,
  onOpenADAS,
}) => {
  const driveModes: DriveMode[] = ['EKO', 'KONFOR', 'SPOR', 'LUDICROUS'];

  // Accelerate simulation
  const handleAccelerate = () => {
    setTelemetry((prev) => {
      const nextSpeed = Math.min(220, prev.speed + 12);
      const nextPower = Math.min(320, prev.powerKw + 45);
      return {
        ...prev,
        speed: nextSpeed,
        gear: prev.gear === 'P' ? 'D' : prev.gear,
        powerKw: nextPower,
      };
    });
  };

  // Brake simulation
  const handleBrake = () => {
    setTelemetry((prev) => {
      const nextSpeed = Math.max(0, prev.speed - 15);
      const nextPower = nextSpeed === 0 ? 0 : -35; // Regenerative braking
      return {
        ...prev,
        speed: nextSpeed,
        gear: nextSpeed === 0 ? prev.gear : 'D',
        powerKw: nextPower,
      };
    });
  };

  const handleModeChange = (mode: DriveMode) => {
    setTelemetry((prev) => ({ ...prev, driveMode: mode }));
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between select-none">
      {/* Top Banner: Autopilot status and Drive Mode */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-wider">
              {telemetry.autopilotActive ? 'AUTOPILOT AKTİF' : 'MANUEL SÜRÜŞ'}
            </span>
          </div>

          <button
            onClick={() =>
              setTelemetry((prev) => ({
                ...prev,
                autopilotActive: !prev.autopilotActive,
              }))
            }
            className="text-[11px] font-semibold text-slate-400 hover:text-cyan-300 px-2 py-1 rounded bg-slate-800/60"
          >
            {telemetry.autopilotActive ? 'Kapat' : 'Autopilot Başlat'}
          </button>

          {/* ADAS Road Safety Badge */}
          {adasTelemetry && (
            <button
              onClick={onOpenADAS}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
                adasTelemetry.danger
                  ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 animate-pulse'
                  : adasTelemetry.warning
                  ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-500'
              }`}
              title="ADAS Görüş Ekranına Git"
            >
              {adasTelemetry.danger ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>
                {adasTelemetry.danger
                  ? 'ÇUKUR UYARISI'
                  : adasTelemetry.warning
                  ? 'Çukur İleride'
                  : 'Yol Açık'}
              </span>
              <span className="text-[10px] opacity-70 underline">Kamera</span>
            </button>
          )}
        </div>

        {/* Drive Modes */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {driveModes.map((mode) => {
            const isActive = telemetry.driveMode === mode;
            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? mode === 'LUDICROUS'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-950'
                      : 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Cockpit Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-auto py-6 items-center">
        {/* Left Widget: Vehicle Energy, Efficiency & Range */}
        <div className="flex flex-col space-y-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Enerji & Menzil
            </span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-4xl font-extrabold text-white">
              {telemetry.rangeKm}
            </span>
            <span className="text-slate-400 font-semibold text-sm">km menzil</span>
          </div>

          {/* Battery Bar with animated gradient */}
          <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] transition-all duration-500"
              style={{ width: `${telemetry.batteryPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/70">
              <span className="text-slate-400 block text-[10px]">Tüketim</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                17.4 kWh/100km
              </span>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/70">
              <span className="text-slate-400 block text-[10px]">Toplam Mesafe</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {telemetry.odometerKm.toLocaleString('tr-TR')} km
              </span>
            </div>
          </div>
        </div>

        {/* Center: Hero Speedometer & Simulated Road Vision */}
        <div className="flex flex-col items-center justify-center relative">
          {/* Dial Graphic */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-slate-800/70 flex flex-col items-center justify-center shadow-2xl bg-gradient-to-b from-slate-900/40 via-slate-950 to-slate-900/90">
            {/* Speed Gauge Arc Glow */}
            <div
              className="absolute inset-1 rounded-full border-4 border-transparent border-t-cyan-400 border-r-cyan-400 opacity-80"
              style={{
                transform: `rotate(${(telemetry.speed / 240) * 180 - 45}deg)`,
                transition: 'transform 0.4s ease-out',
              }}
            />

            {/* Gear badge */}
            <div className="text-xs font-mono font-extrabold px-3 py-0.5 rounded-full bg-slate-800/80 text-cyan-300 border border-cyan-500/30 mb-1">
              VİTES {telemetry.gear}
            </div>

            {/* Big Speed Digital Readout */}
            <div className="font-mono font-black text-6xl sm:text-7xl text-white tracking-tighter drop-shadow-lg">
              {telemetry.speed}
            </div>

            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              KM / SAAT
            </div>

            {/* Live Power Output */}
            <div className="mt-2 text-xs font-mono font-semibold flex items-center space-x-1">
              <span className="text-slate-400">Güç:</span>
              <span
                className={
                  telemetry.powerKw < 0
                    ? 'text-emerald-400 font-bold'
                    : telemetry.powerKw > 80
                    ? 'text-rose-400 font-bold'
                    : 'text-cyan-400 font-bold'
                }
              >
                {telemetry.powerKw > 0 ? `+${telemetry.powerKw}` : telemetry.powerKw} kW
              </span>
            </div>
          </div>

          {/* Drive Simulator Pedals */}
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={handleBrake}
              className="px-6 py-2.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 font-bold text-xs hover:bg-rose-900/60 transition-all active:scale-95 shadow-lg flex items-center space-x-1.5"
            >
              <Disc className="w-4 h-4" />
              <span>FREN / REGEN</span>
            </button>

            <button
              onClick={handleAccelerate}
              className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/50 text-white font-extrabold text-xs hover:from-cyan-500 hover:to-blue-500 transition-all active:scale-95 shadow-xl shadow-cyan-950 flex items-center space-x-1.5"
            >
              <ArrowUp className="w-4 h-4" />
              <span>GAZ VER (+12)</span>
            </button>
          </div>
        </div>

        {/* Right Widget: Navigation Mini Card & Road Environment */}
        <div className="flex flex-col space-y-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Aktif Güzergah
            </span>
            <button
              onClick={onOpenMap}
              className="text-[11px] font-semibold text-cyan-400 hover:underline"
            >
              Haritada Aç
            </button>
          </div>

          {navigation.isNavigating && navigation.destination ? (
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col space-y-2">
              <span className="text-xs font-bold text-cyan-300">
                {navigation.destination.title}
              </span>
              <p className="text-[11px] text-slate-400">
                {navigation.nextTurnInstruction}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-300 font-mono font-bold">
                  {navigation.etaMinutes} dk kaldı
                </span>
                <span className="text-cyan-400 font-mono font-bold">
                  {navigation.distanceRemainingKm} km
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-dashed border-slate-800 text-center">
              <Compass className="w-6 h-6 text-slate-500 mx-auto mb-1" />
              <div className="text-xs font-semibold text-slate-300">
                Hedef Seçilmedi
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Google Harita üzerinden gitmek istediğiniz istasyonu seçin.
              </p>
              <button
                onClick={onOpenMap}
                className="mt-3 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold hover:bg-cyan-500/30"
              >
                Haritaya Git
              </button>
            </div>
          )}

          {/* TPMS Tire Pressure Monitor */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
              <span>Lastik Basınçları (TPMS)</span>
              <span className="text-emerald-400 font-semibold">Normal</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Ön Sol</span>
                <span className="text-white font-bold">
                  {telemetry.tirePressuresBar.frontLeft} bar
                </span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Ön Sağ</span>
                <span className="text-white font-bold">
                  {telemetry.tirePressuresBar.frontRight} bar
                </span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Arka Sol</span>
                <span className="text-white font-bold">
                  {telemetry.tirePressuresBar.rearLeft} bar
                </span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Arka Sağ</span>
                <span className="text-white font-bold">
                  {telemetry.tirePressuresBar.rearRight} bar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
