import React from 'react';
import { AlertTriangle, ShieldAlert, Eye, X, Volume2, VolumeX } from 'lucide-react';
import { ADASTelemetry } from '../types/adas';

interface ADASAlertBannerProps {
  telemetry: ADASTelemetry;
  onOpenLiveCamera: () => void;
  onDismiss: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ADASAlertBanner: React.FC<ADASAlertBannerProps> = ({
  telemetry,
  onOpenLiveCamera,
  onDismiss,
  isMuted,
  onToggleMute,
}) => {
  if (!telemetry.danger && !telemetry.warning) return null;

  const isCritical = telemetry.danger;
  const closestDist = telemetry.detections.length > 0
    ? Math.min(...telemetry.detections.map((d) => d.estimated_dist_m))
    : 15;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-[540px] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div
        className={`relative overflow-hidden rounded-3xl p-4 shadow-2xl backdrop-blur-2xl border transition-all ${
          isCritical
            ? 'bg-rose-950/90 border-rose-500/80 text-rose-50 shadow-[0_10px_40px_rgba(244,63,94,0.4)] animate-pulse'
            : 'bg-amber-950/90 border-amber-500/80 text-amber-50 shadow-[0_10px_40px_rgba(245,158,11,0.3)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isCritical ? 'bg-rose-600 shadow-lg shadow-rose-950' : 'bg-amber-500 text-neutral-950'
              }`}
            >
              {isCritical ? (
                <ShieldAlert className="w-7 h-7 text-white animate-bounce" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/20">
                  {isCritical ? 'ACİL ADAS UYARISI' : 'YOL DİKKAT'}
                </span>
                <span className="text-xs font-bold opacity-80">
                  ~{closestDist} metre ileride
                </span>
              </div>

              <h4 className="font-extrabold text-base sm:text-lg leading-tight mt-0.5">
                {isCritical ? 'YOLDA ÇUKUR YAKLAŞIYOR!' : 'İleride Yol Kusuru / Çukur Var'}
              </h4>

              <p className="text-xs opacity-90 font-medium">
                {isCritical ? 'Hızınızı azaltın, manevra alanını kontrol edin.' : 'Önünüzdeki şeritte çukur tespit edildi.'}
              </p>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              title={isMuted ? 'Sesi Aç' : 'Sesi Sustur'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onDismiss}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action button bar */}
        <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-[11px] opacity-80 font-mono">
            <span>Model: YOLOv8s</span>
            <span>•</span>
            <span>Gecikme: {telemetry.latency_ms}ms</span>
          </div>

          <button
            onClick={onOpenLiveCamera}
            className="px-4 py-1.5 rounded-xl bg-white text-neutral-950 font-black flex items-center space-x-1.5 hover:bg-neutral-200 transition-transform active:scale-95 shadow-md"
          >
            <Eye className="w-4 h-4" />
            <span>Kamerayı Aç</span>
          </button>
        </div>
      </div>
    </div>
  );
};
