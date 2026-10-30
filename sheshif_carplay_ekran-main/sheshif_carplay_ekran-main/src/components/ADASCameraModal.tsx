import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Video,
  Camera,
  Cpu,
  Gauge,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ADASTelemetry, ADASConfig } from '../types/adas';

interface ADASCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: ADASTelemetry;
  isConnected: boolean;
  onUpdateSettings: (settings: Partial<ADASConfig>) => Promise<void>;
  onTogglePause: () => void;
}

export const ADASCameraModal: React.FC<ADASCameraModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  isConnected,
  onUpdateSettings,
  onTogglePause,
}) => {
  const [confThreshold, setConfThreshold] = useState<number>(0.3);
  const [activeSource, setActiveSource] = useState<'video' | 'camera'>('video');

  if (!isOpen) return null;

  const handleConfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setConfThreshold(val);
    onUpdateSettings({ conf: val });
  };

  const handleSwitchSource = (source: 'video' | 'camera') => {
    setActiveSource(source);
    onUpdateSettings({ source });
  };

  const host = typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1';
  const videoFeedUrl = `http://${host}:8000/video_feed`;

  const statusBg =
    telemetry.danger
      ? 'bg-rose-500 text-white'
      : telemetry.warning
      ? 'bg-amber-500 text-neutral-950'
      : 'bg-emerald-500 text-neutral-950';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0f1217] border border-neutral-700/80 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#161a22]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">
                  ADAS Ön Görüş & Çukur Tespiti
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  YOLOv8 + OpenCV
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Gerçek zamanlı yapay zeka kamera akışı ve telemetri
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-mono text-neutral-300">
                {isConnected ? 'Bağlantı Aktif (10Hz)' : 'Sunucu Bekleniyor'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Video Feed & Sidebar Controls */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Camera Stream */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
            {isConnected ? (
              <img
                src={videoFeedUrl}
                alt="ADAS Live Feed"
                className="w-full h-full object-contain max-h-[65vh]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                <RefreshCw className="w-12 h-12 text-sky-400 animate-spin" />
                <h4 className="font-bold text-white text-base">
                  Görüntü İşleme Modeli Sunucusuna Bağlanılıyor...
                </h4>
                <p className="text-xs text-neutral-400 max-w-md">
                  Model arka plan servisi başlatılmadıysa terminalde <code className="text-sky-300 font-mono bg-neutral-900 px-1.5 py-0.5 rounded">python backend/server.py</code> çalıştırın.
                </p>
              </div>
            )}

            {/* Floating Top-Left Status Badge */}
            <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase ${statusBg}`}>
                {telemetry.status}
              </span>
              <span className="text-xs font-semibold text-white">
                {telemetry.status_text}
              </span>
            </div>

            {/* Floating Bottom Live Performance Badges */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5 text-neutral-300">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>Gecikme:</span>
                  <span className={`font-mono font-bold ${telemetry.latency_ms <= 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {telemetry.latency_ms} ms
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-neutral-300">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>FPS:</span>
                  <span className="font-mono font-bold text-white">
                    {telemetry.fps}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-neutral-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tespit:</span>
                  <span className="font-mono font-bold text-white">
                    {telemetry.pothole_count} adet
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-neutral-400">
                Kare: {telemetry.frame_no} / {telemetry.total_frames || '∞'}
              </div>
            </div>
          </div>

          {/* Right Control & Diagnostics Panel */}
          <div className="w-full lg:w-80 bg-[#12161e] border-t lg:border-t-0 lg:border-l border-neutral-800 p-5 flex flex-col justify-between space-y-4 overflow-y-auto">
            <div className="space-y-5">
              {/* Proximity / Obstacle Gauge */}
              <div className="bg-[#1a202c] border border-neutral-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  Engeller & Yakınlık Radar
                </span>

                {telemetry.detections.length === 0 ? (
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold py-2">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>Güzergahta çukur riski yok.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {telemetry.detections.map((det, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          det.in_zone
                            ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <div>
                            <span className="font-bold block">
                              Çukur #{idx + 1}
                            </span>
                            <span className="text-[10px] opacity-80">
                              Güven: %{Math.round(det.conf * 100)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono font-extrabold text-sm">
                          ~{det.estimated_dist_m}m
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Source Switcher */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Görüntü Kaynağı
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSwitchSource('video')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      activeSource === 'video'
                        ? 'bg-sky-500 text-neutral-950 shadow-md'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Test Videosu</span>
                  </button>

                  <button
                    onClick={() => handleSwitchSource('camera')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      activeSource === 'camera'
                        ? 'bg-sky-500 text-neutral-950 shadow-md'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Webcam</span>
                  </button>
                </div>
              </div>

              {/* Sensitivity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300 flex items-center space-x-1">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    <span>Model Hassasiyeti (Conf)</span>
                  </span>
                  <span className="font-mono font-bold text-sky-400">
                    %{Math.round(confThreshold * 100)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={confThreshold}
                  onChange={handleConfChange}
                  className="w-full accent-sky-400 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Hassas (%10)</span>
                  <span>Önerilen (%30)</span>
                  <span>Seçici (%80)</span>
                </div>
              </div>
            </div>

            {/* Bottom Stream Actions */}
            <div className="pt-4 border-t border-neutral-800 space-y-2">
              <button
                onClick={onTogglePause}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Akışı Duraklat / Devam Et</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-extrabold text-xs flex items-center justify-center transition-all active:scale-95"
              >
                Haritaya / Ekrana Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
