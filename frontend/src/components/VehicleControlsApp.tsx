import React from 'react';
import {
  Car,
  Lock,
  Unlock,
  Zap,
  Lightbulb,
  Shield,
  Eye,
  Sliders,
  Power,
  ChevronRight,
  Sun,
  ShieldAlert,
} from 'lucide-react';
import { VehicleTelemetry } from '../types/automotive';

interface VehicleControlsAppProps {
  telemetry: VehicleTelemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<VehicleTelemetry>>;
}

export const VehicleControlsApp: React.FC<VehicleControlsAppProps> = ({
  telemetry,
  setTelemetry,
}) => {
  const toggleDoor = (door: keyof VehicleTelemetry['doors']) => {
    setTelemetry((prev) => ({
      ...prev,
      doors: {
        ...prev.doors,
        [door]: !prev.doors[door],
      },
    }));
  };

  const setLights = (mode: VehicleTelemetry['lights']) => {
    setTelemetry((prev) => ({ ...prev, lights: mode }));
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col md:flex-row gap-6 overflow-y-auto select-none">
      {/* Left: 3D Car Visual & Door / Frunk / Trunk Interactive Hotspots */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-between shadow-2xl relative">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white text-base">
              AutoDrive e-Vision GT
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            Sistemler Normal
          </span>
        </div>

        {/* Vehicle Body Representation */}
        <div className="relative my-8 w-64 sm:w-80 h-72 flex flex-col items-center justify-center">
          {/* Car Graphic Outline Box */}
          <div className="relative w-44 h-64 rounded-[40px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col items-center justify-between p-4">
            {/* Frunk Hotspot */}
            <button
              onClick={() => toggleDoor('frunk')}
              className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                telemetry.doors.frunk
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-400'
              }`}
            >
              Ön Bagaj {telemetry.doors.frunk ? '(AÇIK)' : ''}
            </button>

            {/* Windshield Glass */}
            <div className="w-32 h-16 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
              <span className="text-[10px] text-cyan-300 font-mono font-semibold">
                Panoramik Cam
              </span>
            </div>

            {/* Door Locks */}
            <div className="w-full flex justify-between px-1">
              <button
                onClick={() => toggleDoor('driver')}
                className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  telemetry.doors.driver
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Sol Kapı
              </button>
              <button
                onClick={() => toggleDoor('passenger')}
                className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  telemetry.doors.passenger
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Sağ Kapı
              </button>
            </div>

            {/* Trunk & Charge Port Hotspots */}
            <div className="w-full flex items-center justify-between pt-1">
              <button
                onClick={() => toggleDoor('chargePort')}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border flex items-center space-x-1 ${
                  telemetry.doors.chargePort
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Şarj Girişi</span>
              </button>

              <button
                onClick={() => toggleDoor('trunk')}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${
                  telemetry.doors.trunk
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-400'
                }`}
              >
                Arka Bagaj
              </button>
            </div>
          </div>
        </div>

        {/* Quick Lock/Unlock bottom bar */}
        <div className="w-full flex items-center justify-center space-x-4">
          <button
            onClick={() =>
              setTelemetry((prev) => ({ ...prev, locked: !prev.locked }))
            }
            className={`w-full py-2.5 rounded-2xl border font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              telemetry.locked
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {telemetry.locked ? (
              <>
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Tüm Kapılar Kilitli</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-amber-400" />
                <span>Kapı Kilitlerini Aç</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right: Lighting, Suspension & Security Controls */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Exterior Lights */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Dış Aydınlatma & Farlar
          </span>
          <div className="grid grid-cols-4 gap-2">
            {(['auto', 'off', 'low', 'high'] as VehicleTelemetry['lights'][]).map(
              (mode) => {
                const isActive = telemetry.lights === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setLights(mode)}
                    className={`py-3 rounded-2xl border text-xs font-bold uppercase transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-950 font-black'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {mode === 'auto'
                      ? 'Otomatik'
                      : mode === 'off'
                      ? 'Kapalı'
                      : mode === 'low'
                      ? 'Kısa'
                      : 'Uzun'}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Security & Sentry Mode */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span className="font-bold text-sm text-white">
                Sentry Nöbetçi Modu
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              360° Çevre güvenlik kameraları ve hareket sensörleri
            </p>
          </div>

          <button
            onClick={() =>
              setTelemetry((prev) => ({
                ...prev,
                sentryMode: !prev.sentryMode,
              }))
            }
            className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
              telemetry.sentryMode
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-950'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            {telemetry.sentryMode ? 'AKTİF' : 'DEVRE DIŞI'}
          </button>
        </div>

        {/* Air Suspension Height */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl shadow-xl flex-1 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Akıllı Havalı Süspansiyon
          </span>
          <div className="grid grid-cols-3 gap-3">
            {['Alçak (Otoyol)', 'Standart', 'Yüksek (Arazi)'].map(
              (level, i) => (
                <button
                  key={level}
                  className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                    i === 1
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {level}
                </button>
              )
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Hız 110 km/s üzerine çıktığında süspansiyon otomatik olarak alçalır.
          </p>
        </div>
      </div>
    </div>
  );
};
