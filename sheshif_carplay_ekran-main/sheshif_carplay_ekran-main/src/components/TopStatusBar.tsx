import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Radio,
  Bluetooth,
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  BatteryCharging,
  Maximize2,
  Minimize2,
  CloudSun,
} from 'lucide-react';
import { Gear, VehicleTelemetry } from '../types/automotive';

interface TopStatusBarProps {
  telemetry: VehicleTelemetry;
  onGearChange: (gear: Gear) => void;
  onToggleLock: () => void;
  onToggleSentry: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  telemetry,
  onGearChange,
  onToggleLock,
  onToggleSentry,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const gears: Gear[] = ['P', 'R', 'N', 'D'];

  return (
    <header className="h-12 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between text-xs select-none z-40 shrink-0">
      {/* Left: Gear selector and Speed preview */}
      <div className="flex items-center space-x-3">
        {/* Gear Box */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/70 shadow-inner">
          {gears.map((g) => {
            const isActive = telemetry.gear === g;
            return (
              <button
                key={g}
                onClick={() => onGearChange(g)}
                className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center transition-all ${
                  isActive
                    ? g === 'P'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-sm'
                      : g === 'R'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-sm'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Vites ${g}`}
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Current Speed mini pill */}
        <div className="flex items-baseline space-x-1 px-2.5 py-1 bg-slate-950/70 border border-slate-800 rounded-md">
          <span className="font-mono text-sm font-bold text-slate-100">
            {telemetry.speed}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">km/s</span>
        </div>

        {/* Drive Mode Indicator */}
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-slate-800/80 text-cyan-300 border border-cyan-500/30">
          {telemetry.driveMode}
        </span>
      </div>

      {/* Center: Clock & Weather */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-xs">19°C</span>
          <span className="hidden md:inline text-slate-400 text-[11px]">• İstanbul</span>
        </div>

        <div className="font-mono text-sm font-semibold text-white tracking-widest px-2 py-0.5 bg-slate-950/60 rounded border border-slate-800/60">
          {timeStr || '12:00'}
        </div>

        <div className="hidden lg:flex items-center space-x-1 text-slate-400 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <span>Zeynep Tatar</span>
        </div>
      </div>

      {/* Right: Telemetry & Controls */}
      <div className="flex items-center space-x-3">
        {/* Sentry Mode Button */}
        <button
          onClick={onToggleSentry}
          className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
            telemetry.sentryMode
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Sentry Nöbetçi Modu"
        >
          {telemetry.sentryMode ? (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          ) : (
            <Shield className="w-3.5 h-3.5" />
          )}
          <span className="hidden xl:inline text-[10px]">Sentry</span>
        </button>

        {/* Lock / Unlock */}
        <button
          onClick={onToggleLock}
          className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          title={telemetry.locked ? 'Kapılar Kilitli' : 'Kapılar Açık'}
        >
          {telemetry.locked ? (
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>

        {/* Signals */}
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
          <Wifi className="w-3.5 h-3.5" />
          <Radio className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono font-medium">5G</span>
        </div>

        {/* Battery SOC */}
        <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
          <div className="flex items-baseline space-x-1">
            <span className="font-mono font-bold text-xs text-emerald-400">
              %{telemetry.batteryPercent}
            </span>
            <span className="text-[10px] text-slate-400">
              {telemetry.rangeKm} km
            </span>
          </div>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          title="Tam Ekran"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
};
