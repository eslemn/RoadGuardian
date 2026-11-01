import React from 'react';
import {
  Fan,
  Wind,
  Shield,
  RotateCcw,
  Flame,
  CircleDot,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { ClimateState } from '../types/automotive';

interface ClimateAppProps {
  climate: ClimateState;
  onChangeClimate: (updates: Partial<ClimateState>) => void;
}

export const ClimateApp: React.FC<ClimateAppProps> = ({
  climate,
  onChangeClimate,
}) => {
  const airflowOptions: { id: ClimateState['airFlowDirection']; label: string }[] = [
    { id: 'windshield', label: 'Ön Cam' },
    { id: 'face', label: 'Yüz / Gövde' },
    { id: 'face-feet', label: 'Yüz & Ayak' },
    { id: 'feet', label: 'Ayak Bölgesi' },
  ];

  const syncTemps = () => {
    onChangeClimate({ passengerTemp: climate.driverTemp });
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">İklimlendirme & Konfor</h2>
          <p className="text-xs text-slate-400">
            Çift Bölgeli Akıllı Havalandırma & HEPA Hava Temizleme
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={syncTemps}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sıcaklıkları Eşitle (SYNC)</span>
          </button>

          <button
            onClick={() => onChangeClimate({ acOn: !climate.acOn })}
            className={`px-4 py-1.5 rounded-xl border font-bold text-xs transition-all ${
              climate.acOn
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            A/C {climate.acOn ? 'AÇIK' : 'KAPALI'}
          </button>
        </div>
      </div>

      {/* Main Cabin Airflow Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto py-6 items-center">
        {/* Driver Zone Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Sürücü Tarafı
          </span>

          <div className="flex items-center space-x-4 my-2">
            <button
              onClick={() =>
                onChangeClimate({
                  driverTemp: Math.max(16, climate.driverTemp - 0.5),
                })
              }
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-2xl font-bold flex items-center justify-center transition-all active:scale-95"
            >
              -
            </button>
            <span className="font-mono text-5xl font-black text-white">
              {climate.driverTemp.toFixed(1)}°
            </span>
            <button
              onClick={() =>
                onChangeClimate({
                  driverTemp: Math.min(28, climate.driverTemp + 0.5),
                })
              }
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-2xl font-bold flex items-center justify-center transition-all active:scale-95"
            >
              +
            </button>
          </div>

          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={() =>
                onChangeClimate({
                  driverSeatHeater: (climate.driverSeatHeater + 1) % 4,
                })
              }
              className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                climate.driverSeatHeater > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>
                Koltuk Isıtma: {climate.driverSeatHeater === 0 ? 'Kapalı' : `Kademe ${climate.driverSeatHeater}`}
              </span>
            </button>

            <button
              onClick={() =>
                onChangeClimate({
                  steeringWheelHeater: !climate.steeringWheelHeater,
                })
              }
              className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                climate.steeringWheelHeater
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <CircleDot className="w-4 h-4" />
              <span>Direksiyon Isıtma</span>
            </button>
          </div>
        </div>

        {/* Passenger Zone Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Ön Yolcu Tarafı
          </span>

          <div className="flex items-center space-x-4 my-2">
            <button
              onClick={() =>
                onChangeClimate({
                  passengerTemp: Math.max(16, climate.passengerTemp - 0.5),
                })
              }
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-2xl font-bold flex items-center justify-center transition-all active:scale-95"
            >
              -
            </button>
            <span className="font-mono text-5xl font-black text-white">
              {climate.passengerTemp.toFixed(1)}°
            </span>
            <button
              onClick={() =>
                onChangeClimate({
                  passengerTemp: Math.min(28, climate.passengerTemp + 0.5),
                })
              }
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-2xl font-bold flex items-center justify-center transition-all active:scale-95"
            >
              +
            </button>
          </div>

          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={() =>
                onChangeClimate({
                  passengerSeatHeater: (climate.passengerSeatHeater + 1) % 4,
                })
              }
              className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                climate.passengerSeatHeater > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>
                Koltuk Isıtma: {climate.passengerSeatHeater === 0 ? 'Kapalı' : `Kademe ${climate.passengerSeatHeater}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Airflow Direction & Fan Speed Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
        {/* Airflow Direction Buttons */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Hava Üfleme Yönü
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {airflowOptions.map((opt) => {
              const isSelected = climate.airFlowDirection === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChangeClimate({ airFlowDirection: opt.id })}
                  className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fan Speed Stepper */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fan Hızı (Seviye {climate.fanSpeed})
            </span>
            <button
              onClick={() => onChangeClimate({ autoFan: !climate.autoFan })}
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                climate.autoFan
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400'
              }`}
            >
              AUTO
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
            <Fan className="w-5 h-5 text-slate-400 ml-1" />
            <div className="flex-1 grid grid-cols-5 gap-1.5 px-2">
              {[1, 2, 3, 4, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onChangeClimate({ fanSpeed: speed, autoFan: false })}
                  className={`h-8 rounded-lg font-bold text-xs transition-all ${
                    speed <= climate.fanSpeed
                      ? 'bg-gradient-to-t from-cyan-600 to-blue-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  }`}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
