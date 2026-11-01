import { useState, useEffect, useRef, useCallback } from 'react';
import { ADASTelemetry, ADASConfig } from '../types/adas';

const INITIAL_TELEMETRY: ADASTelemetry = {
  status: 'CLEAR',
  status_text: 'Yol Temiz',
  danger: false,
  warning: false,
  pothole_count: 0,
  detections: [],
  latency_ms: 0,
  fps: 0,
  frame_no: 0,
  total_frames: 0,
  timestamp: Date.now() / 1000,
  source: 'video',
};

// Play modern high-tech automotive audio beep
function playWarningChime(isCritical: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCritical ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isCritical ? 880 : 587.33, ctx.currentTime); // A5 or D5
    if (isCritical) {
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    }

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context might be restricted before first user interaction
  }
}

export function useADASVision() {
  const [telemetry, setTelemetry] = useState<ADASTelemetry>(INITIAL_TELEMETRY);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);

  const prevDangerRef = useRef<boolean>(false);
  const lastChimeTimeRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      // Direct to port 8000 (backend) or through Vite proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const wsUrl = `${protocol}//${host}:8000/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: ADASTelemetry = JSON.parse(event.data);
            setTelemetry(data);

            // Audio warning trigger
            const now = Date.now();
            if (data.danger && (!prevDangerRef.current || now - lastChimeTimeRef.current > 2500)) {
              if (!isMuted) {
                playWarningChime(true);
              }
              lastChimeTimeRef.current = now;
              setAlertDismissed(false);
            } else if (data.warning && !data.danger && !prevDangerRef.current && now - lastChimeTimeRef.current > 4000) {
              if (!isMuted) {
                playWarningChime(false);
              }
              lastChimeTimeRef.current = now;
            }

            prevDangerRef.current = data.danger;
          } catch {
            // JSON parse error ignore
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isMuted]);

  const updateSettings = useCallback(async (newSettings: Partial<ADASConfig>) => {
    try {
      const host = window.location.hostname || '127.0.0.1';
      await fetch(`http://${host}:8000/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch {
      // Backend unreachable
    }
  }, []);

  const togglePause = useCallback(async () => {
    try {
      const nextPaused = !telemetry.is_paused;
      await updateSettings({ is_paused: nextPaused });
    } catch {
      // Backend unreachable
    }
  }, [telemetry.is_paused, updateSettings]);

  const restartVideo = useCallback(async () => {
    try {
      const host = window.location.hostname || '127.0.0.1';
      await fetch(`http://${host}:8000/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restart: true, is_paused: false }),
      });
    } catch {
      // Backend unreachable
    }
  }, []);

  const switchSource = useCallback(async (source: 'video' | 'camera') => {
    await updateSettings({ source });
  }, [updateSettings]);

  const setConfidence = useCallback(async (conf: number) => {
    await updateSettings({ conf });
  }, [updateSettings]);

  const dismissAlert = useCallback(() => {
    setAlertDismissed(true);
  }, []);

  return {
    telemetry,
    isConnected,
    isCameraModalOpen,
    setIsCameraModalOpen,
    isMuted,
    setIsMuted,
    alertDismissed,
    dismissAlert,
    updateSettings,
    togglePause,
    restartVideo,
    switchSource,
    setConfidence,
  };
}
