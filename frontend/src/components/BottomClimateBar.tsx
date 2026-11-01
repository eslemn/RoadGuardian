import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Fan,
  Wind,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Flame,
} from 'lucide-react';
import { ClimateState, MediaTrack } from '../types/automotive';

interface BottomClimateBarProps {
  climate: ClimateState;
  onChangeClimate: (updates: Partial<ClimateState>) => void;
  currentTrack: MediaTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  onOpenClimateApp: () => void;
}

export const BottomClimateBar: React.FC<BottomClimateBarProps> = ({
  climate,
  onChangeClimate,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  volume,
  onChangeVolume,
  onOpenClimateApp,
}) => {
  const stepDriverTemp = (delta: number) => {
    const next = Math.min(28, Math.max(16, Math.round((climate.driverTemp + delta) * 2) / 2));
    onChangeClimate({ driverTemp: next });
  };

  const stepPassengerTemp = (delta: number) => {
    const next = Math.min(28, Math.max(16, Math.round((climate.passengerTemp + delta) * 2) / 2));
    onChangeClimate({ passengerTemp: next });
  };

  const cycleDriverSeat = () => {
    onChangeClimate({ driverSeatHeater: (climate.driverSeatHeater + 1) % 4 });
  };

  const cyclePassengerSeat = () => {
    onChangeClimate({ passengerSeatHeater: (climate.passengerSeatHeater + 1) % 4 });
  };

  return (
    <footer className="h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-3 sm:px-6 flex items-center justify-between text-xs select-none z-30 shrink-0">
      {/* Driver Climate Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Driver Seat Heater */}
        <button
          onClick={cycleDriverSeat}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border transition-all ${
            climate.driverSeatHeater > 0
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
              : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Sürücü Koltuk Isıtma"
        >
          <Flame className="w-4 h-4 fill-current" />
          <span className="font-mono text-[11px] font-bold">
            {climate.driverSeatHeater === 0 ? 'KAPALI' : `L${climate.driverSeatHeater}`}
          </span>
        </button>

        {/* Driver Temperature Stepper */}
        <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => stepDriverTemp(-0.5)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenClimateApp}
            className="px-2 font-mono text-sm sm:text-base font-bold text-white tracking-tight hover:text-cyan-300"
            title="Klima Ayarları"
          >
            {climate.driverTemp.toFixed(1)}°
          </button>
          <button
            onClick={() => stepDriverTemp(0.5)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Front Defrost */}
        <button
          onClick={() => onChangeClimate({ frontDefrost: !climate.frontDefrost })}
          className={`hidden md:flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
            climate.frontDefrost
              ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-sm'
              : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Ön Cam Buğu Çözücü"
        >
          <Wind className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Audio Bar & Fan quick toggles */}
      <div className="flex items-center space-x-2 sm:space-x-5 max-w-xs sm:max-w-md w-full justify-center">
        {/* Quick Media Widget */}
        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl px-3 py-1.5 shadow-inner">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-8 h-8 rounded-lg object-cover shadow-sm shrink-0"
          />
          <div className="hidden lg:flex flex-col max-w-[120px] overflow-hidden text-left">
            <span className="font-semibold text-slate-200 truncate text-[11px]">
              {currentTrack.title}
            </span>
            <span className="text-slate-400 truncate text-[10px]">
              {currentTrack.artist}
            </span>
          </div>

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center hover:bg-cyan-500/30 transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onNextTrack}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Stepper */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 rounded-xl">
          <button
            onClick={() => onChangeVolume(volume > 0 ? 0 : 50)}
            className="text-slate-400 hover:text-slate-200"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => onChangeVolume(Number(e.target.value))}
            className="w-16 md:w-20 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* AC Auto Button */}
        <button
          onClick={() => onChangeClimate({ acOn: !climate.acOn })}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
            climate.acOn
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
              : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Klima AC Aç / Kapat"
        >
          <Fan className={`w-4 h-4 ${climate.acOn ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span className="font-bold text-[10px]">A/C</span>
        </button>
      </div>

      {/* Passenger Climate Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Passenger Temperature Stepper */}
        <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => stepPassengerTemp(-0.5)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenClimateApp}
            className="px-2 font-mono text-sm sm:text-base font-bold text-white tracking-tight hover:text-cyan-300"
            title="Yolcu Klima Ayarları"
          >
            {climate.passengerTemp.toFixed(1)}°
          </button>
          <button
            onClick={() => stepPassengerTemp(0.5)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Passenger Seat Heater */}
        <button
          onClick={cyclePassengerSeat}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border transition-all ${
            climate.passengerSeatHeater > 0
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
              : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Yolcu Koltuk Isıtma"
        >
          <Flame className="w-4 h-4 fill-current" />
          <span className="font-mono text-[11px] font-bold">
            {climate.passengerSeatHeater === 0 ? 'KAPALI' : `L${climate.passengerSeatHeater}`}
          </span>
        </button>
      </div>
    </footer>
  );
};
