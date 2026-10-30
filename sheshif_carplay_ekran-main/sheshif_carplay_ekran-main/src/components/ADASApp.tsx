import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Gauge,
  Video,
  Camera,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ADASTelemetry, ADASConfig } from '../types/adas';

interface ADASAppProps {
  telemetry: ADASTelemetry;
  isConnected: boolean;
  onUpdateSettings: (settings: Partial<ADASConfig>) => Promise<void>;
  onTogglePause: () => void;
}

export const ADASApp: React.FC<ADASAppProps> = ({
  telemetry,
  isConnected,
  onUpdateSettings,
  onTogglePause,
}) => {
  const [conf, setConf] = useState(0.3);
  const [useRoi, setUseRoi] = useState(true);
  const [source, setSource] = useState<'video' | 'camera'>('video');

  const host = typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1';
  const videoFeedUrl = `http://${host}:8000/video_feed`;

  const handleConfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setConf(val);
    onUpdateSettings({ conf: val });
  };

  const handleToggleRoi = () => {
    const nextRoi = !useRoi;
    setUseRoi(nextRoi);
    onUpdateSettings({ use_roi: nextRoi });
  };

  const handleSourceChange = (newSource: 'video' | 'camera') => {
    setSource(newSource);
    onUpdateSettings({ source: newSource });
  };

  return (
    <div className="w-full h-full bg-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between select-none">
      {/* Top Banner: Status & Connection */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-xl border text-xs font-bold ${
              telemetry.danger
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                : telemetry.warning
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            }`}
          >
            {telemetry.danger ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span className="tracking-wider">
              {telemetry.status === 'DANGER'
                ? 'ACİL ADAS: ÇUKUR YAKLAŞIYOR'
                : telemetry.status === 'WARNING'
                ? 'DİKKAT: İLERİDE ÇUKUR VAR'
                : 'YOL GÜVENLİĞİ: GÜZERGAH TEMİZ'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{isConnected ? 'Vision Sunucusu Aktif' : 'Vision Bağlantısı Kesildi'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePause}
            className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Durdur / Başlat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Stream + Right Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 flex-1 min-h-0">
        {/* Left: Video Feed with HUD (8 cols) */}
        <div className="lg:col-span-8 bg-black/90 rounded-3xl border border-slate-800/80 overflow-hidden flex flex-col justify-between relative shadow-2xl">
          {/* Header pill */}
          <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs text-white">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">Ön Kamera (YOLOv8 ADAS Stream)</span>
          </div>

          {/* Center Image */}
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-slate-950">
            {isConnected ? (
              <img
                src={videoFeedUrl}
                alt="Front Camera Feed"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <RotateCcw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">
                  Model sunucusuna bağlanılıyor... (Port: 8000)
                </p>
              </div>
            )}
          </div>

          {/* Bottom Live Metrics Overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gecikme:</span>
                <strong className={telemetry.latency_ms <= 100 ? 'text-emerald-400' : 'text-rose-400'}>
                  {telemetry.latency_ms} ms
                </strong>
              </span>

              <span className="flex items-center space-x-1 text-slate-300">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>FPS:</span>
                <strong className="text-white">{telemetry.fps}</strong>
              </span>
            </div>

            <span className="font-mono text-xs text-slate-400">
              Kare: {telemetry.frame_no} / {telemetry.total_frames || '∞'}
            </span>
          </div>
        </div>

        {/* Right: Vision Telemetry & Settings (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* Obstacle / Danger Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Yol Kusurları & Çukurlar</span>
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {telemetry.pothole_count} Tespit
              </span>
            </div>

            {telemetry.detections.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-300 block">
                  Yol Güzergahı Temiz
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Algılama bölgesinde çukur veya engel bulunamadı.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {telemetry.detections.map((det, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                      det.in_zone
                        ? 'bg-rose-950/70 border-rose-500/70 text-rose-200 animate-pulse'
                        : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">
                        {det.in_zone ? '⚠️ Acil Çukur Tehlikesi' : '🔍 İleride Çukur'}
                      </span>
                      <span className="text-[10px] opacity-80">
                        Güven Skoru: %{Math.round(det.conf * 100)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-extrabold text-base block">
                        ~{det.estimated_dist_m}m
                      </span>
                      <span className="text-[9px] uppercase tracking-wider opacity-70">
                        Mesafe
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Controls */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-xl space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Model Parametreleri
            </span>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Görüntü Girişi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSourceChange('video')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    source === 'video'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>test2.mp4</span>
                </button>

                <button
                  onClick={() => handleSourceChange('camera')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    source === 'camera'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Kamera (0)</span>
                </button>
              </div>
            </div>

            {/* Confidence Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center space-x-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Güven Eşiği (Conf)</span>
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  %{Math.round(conf * 100)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={conf}
                onChange={handleConfChange}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* ROI Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>ROI (Yol Kırpma)</span>
              </span>
              <button
                onClick={handleToggleRoi}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  useRoi
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {useRoi ? 'Aktif (%35-%88)' : 'Kapalı'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
