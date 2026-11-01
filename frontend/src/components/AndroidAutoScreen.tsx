import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Wifi,
  Signal,
  BatteryMedium,
  Mic,
  Bell,
  Grid,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MoreVertical,
  CornerUpRight,
  CornerUpLeft,
  X,
  Settings,
  GitFork,
  Search,
  MapPin,
  MoreHorizontal,
  Navigation,
  MessageSquare,
  Music,
  Phone,
  Radio,
  Calendar,
  CloudSun,
  ShieldAlert,
  Camera,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Video,
  Volume2,
  Check,
  Send,
} from 'lucide-react';
import { ANDROID_AUTO_DARK_MAP_STYLE } from '../styles/mapStyles';
import { ADASTelemetry } from '../types/adas';

interface AndroidAutoScreenProps {
  apiKey: string;
  adasTelemetry?: ADASTelemetry;
  adasConnected?: boolean;
  onOpenLiveCamera?: () => void;
  onTogglePause?: () => void;
  onRestartVideo?: () => void;
  onSwitchSource?: (source: 'video' | 'camera') => void;
  onSetConfidence?: (conf: number) => void;
}

// Route Polyline renderer component
const RoutePolyline: React.FC<{
  path: { lat: number; lng: number }[];
}> = ({ path }) => {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (polyline) {
      polyline.setPath(path);
      polyline.setMap(map);
    } else {
      const newLine = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#38bdf8', // Vibrant electric blue navigation line
        strokeOpacity: 0.95,
        strokeWeight: 7,
        map,
      });
      setPolyline(newLine);
    }

    return () => {
      if (polyline) {
        polyline.setMap(null);
      }
    };
  }, [map, path]);

  return null;
};

// Map Camera updater
const MapCameraUpdater: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center, zoom]);
  return null;
};

export const AndroidAutoScreen: React.FC<AndroidAutoScreenProps> = ({
  apiKey,
  adasTelemetry,
  adasConnected,
  onOpenLiveCamera,
  onTogglePause,
  onRestartVideo,
  onSwitchSource,
  onSetConfidence,
}) => {
  // CarPlay Integrated Layout Modes
  const [leftCardMode, setLeftCardMode] = useState<'camera' | 'message'>('camera');
  const [mainViewMode, setMainViewMode] = useState<'map' | 'camera'>('map');
  const [streamRetryKey, setStreamRetryKey] = useState(0);

  const host = typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1';
  const videoFeedUrl = `http://${host}:8000/video_feed`;

  // Auto switch to camera card when danger is detected
  useEffect(() => {
    if (adasTelemetry?.danger) {
      setLeftCardMode('camera');
    }
  }, [adasTelemetry?.danger]);

  // Clock time
  const [currentTime, setCurrentTime] = useState('12:35');
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaProgress, setMediaProgress] = useState(38); // %
  const [isReadingMessage, setIsReadingMessage] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  // Overlays
  const [showAppDrawer, setShowAppDrawer] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBezelFrame, setShowBezelFrame] = useState(true);

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(true);
  const [destinationName, setDestinationName] = useState('Central Express Way');
  const [etaText, setEtaText] = useState('6:58 PM');
  const [remainingTime, setRemainingTime] = useState('24 min');
  const [remainingDistance, setRemainingDistance] = useState('8 mi');

  // Simulated Car Position along Route
  const [carPosIndex, setCarPosIndex] = useState(1);
  const routePoints = [
    { lat: 41.0785, lng: 29.0120 },
    { lat: 41.0850, lng: 29.0150 },
    { lat: 41.0920, lng: 29.0175 },
    { lat: 41.1010, lng: 29.0195 },
    { lat: 41.1118, lng: 29.0205 },
  ];

  const currentCarPos = routePoints[carPosIndex] || routePoints[0];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Media track simulation progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setMediaProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Audio message readout simulation
  const handlePlayMessageAudio = () => {
    setIsReadingMessage(true);
    setTimeout(() => {
      setIsReadingMessage(false);
    }, 4500);
  };

  const handleSendReply = () => {
    setShowReplyModal(false);
    setReplyInput('');
  };

  const handleSelectDestination = (name: string, dist: string, time: string, eta: string) => {
    setDestinationName(name);
    setRemainingDistance(dist);
    setRemainingTime(time);
    setEtaText(eta);
    setIsNavigating(true);
    setShowSearchModal(false);
    setShowRouteOptions(false);
  };

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-neutral-950 overflow-hidden ${
        showBezelFrame ? 'p-2 sm:p-5 lg:p-8' : 'p-0'
      }`}
    >
      {/* Automotive Physical Screen Frame (Bezel & Car Dash Trim) */}
      <div
        className={`relative w-full h-full max-w-[1600px] flex overflow-hidden ${
          showBezelFrame
            ? 'rounded-[32px] border-[12px] sm:border-[16px] border-[#181a1f] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_2px_#272a33,inset_0_2px_4px_rgba(255,255,255,0.1)]'
            : 'rounded-none'
        }`}
      >
        {/* Toggle Frame Control (Discreet at top right of viewport) */}
        <div className="absolute top-2 right-2 z-50 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-neutral-300">
          <span>Çerçeve:</span>
          <button
            onClick={() => setShowBezelFrame(!showBezelFrame)}
            className="font-bold text-sky-400 hover:underline"
          >
            {showBezelFrame ? 'Gizle' : 'Göster'}
          </button>
        </div>

        {/* 1. LEFT VERTICAL ANDROID AUTO RAIL (Taskbar) */}
        <aside className="w-16 sm:w-20 bg-[#0f1217] flex flex-col items-center justify-between py-4 select-none z-30 shrink-0 border-r border-[#1a1f29]">
          {/* Top: Status Indicators & Digital Clock */}
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-1 text-neutral-400">
              <Wifi className="w-3.5 h-3.5" />
              <Signal className="w-3.5 h-3.5" />
              <BatteryMedium className="w-3.5 h-3.5" />
            </div>
            <span className="font-sans text-base font-bold text-white tracking-tight pt-1">
              {currentTime}
            </span>
          </div>

          {/* Bottom: Assistant, Notifications, App Drawer */}
          <div className="flex flex-col items-center space-y-5">
            {/* Google Assistant Microphone (Iconic 4-color styling) */}
            <button
              onClick={() => {
                setShowAssistant(true);
                setShowAppDrawer(false);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-800/80 active:scale-95 transition-all group"
              title="Google Asistan"
            >
              <div className="relative flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
                {/* 4 dots color badge */}
                <div className="absolute -bottom-1 flex space-x-0.5">
                  <span className="w-1 h-1 rounded-full bg-blue-500" />
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                </div>
              </div>
            </button>

            {/* ADAS Vision Camera Quick Toggle between Map and Camera */}
            <button
              onClick={() => {
                setMainViewMode((prev) => (prev === 'camera' ? 'map' : 'camera'));
                setLeftCardMode('camera');
              }}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                mainViewMode === 'camera'
                  ? 'bg-sky-500 text-neutral-950 ring-2 ring-sky-400/50'
                  : adasTelemetry?.danger
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900'
                  : adasTelemetry?.warning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
              }`}
              title={mainViewMode === 'camera' ? 'Haritaya Dön' : 'ADAS Ön Kamerayı Ana Ekrana Büyüt'}
            >
              <Camera className="w-5 h-5" />
              {adasTelemetry?.danger && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-[#0f1217] animate-ping" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800/80 active:scale-95 transition-all"
              title="Bildirimler"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0f1217]" />
            </button>

            {/* App Drawer (9 Dots) */}
            <button
              onClick={() => {
                setShowAppDrawer(!showAppDrawer);
                setShowAssistant(false);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                showAppDrawer
                  ? 'bg-neutral-800 text-sky-400 ring-2 ring-sky-500/50'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
              }`}
              title="Uygulama Menüsü"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* 2. MAIN WORKSPACE (SPLIT SCREEN: LEFT CARDS + RIGHT MAP) */}
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative bg-[#0b0e14]">
          {/* LEFT WIDGET STACK (Coolwalk Communication + Media Cards) */}
          <div className="w-full md:w-[360px] lg:w-[410px] xl:w-[440px] h-full flex flex-col justify-between p-3 sm:p-4 space-y-3 z-20 shrink-0 select-none overflow-y-auto no-scrollbar">
            {/* TOP CARD: ADAS Front Camera / Communication Card */}
            <div
              className={`bg-[#1b212c] border rounded-3xl p-3.5 shadow-xl flex flex-col justify-between transition-all ${
                adasTelemetry?.danger
                  ? 'border-rose-500/90 shadow-[0_0_30px_rgba(244,63,94,0.4)] ring-2 ring-rose-500/50'
                  : adasTelemetry?.warning
                  ? 'border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'border-[#273040] hover:border-[#344055]'
              }`}
            >
              {/* Card Header & Tab Switcher */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#252d3d]">
                <div className="flex items-center space-x-1.5 bg-[#12161f] p-1 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setLeftCardMode('camera')}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      leftCardMode === 'camera'
                        ? 'bg-sky-500 text-neutral-950 shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Ön Görüş ADAS</span>
                    {adasTelemetry?.danger && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </button>

                  <button
                    onClick={() => setLeftCardMode('message')}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      leftCardMode === 'message'
                        ? 'bg-sky-500 text-neutral-950 shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Mesaj</span>
                  </button>
                </div>

                <button
                  onClick={() => setMainViewMode(mainViewMode === 'camera' ? 'map' : 'camera')}
                  className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                  title={mainViewMode === 'camera' ? 'Haritaya Dön' : 'Kamerayı Sağ Ekrana Büyüt'}
                >
                  {mainViewMode === 'camera' ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {leftCardMode === 'camera' ? (
                /* LIVE FRONT CAMERA INSIDE CARPLAY CARD */
                <div className="flex flex-col space-y-2">
                  <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden bg-black border border-[#2a3447] group">
                    <img
                      key={streamRetryKey}
                      src={`${videoFeedUrl}?r=${streamRetryKey}`}
                      alt="ADAS Front Camera Feed"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setTimeout(() => setStreamRetryKey((prev) => prev + 1), 2000);
                      }}
                    />

                    {/* Centered Big Play Button when paused */}
                    {adasTelemetry?.is_paused && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <button
                          onClick={onTogglePause}
                          className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-black text-xs shadow-2xl flex items-center space-x-2 transition-transform active:scale-95 animate-pulse"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Videoyu Başlat</span>
                        </button>
                      </div>
                    )}

                    {/* Top Status Alert Badge */}
                    <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                      {adasTelemetry?.danger ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-600/95 backdrop-blur-md text-white font-black text-[10px] flex items-center space-x-1.5 animate-pulse shadow-lg">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>ÖNÜNÜZDE ÇUKUR (~{adasTelemetry.detections.find(d => d.in_zone)?.estimated_dist_m || 10}m)</span>
                        </span>
                      ) : adasTelemetry?.warning ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/95 backdrop-blur-md text-neutral-950 font-bold text-[10px] flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>İLERİDE ÇUKUR VAR</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/90 backdrop-blur-md text-neutral-950 font-black text-[10px] flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
                          <span>YOL TEMİZ</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom HUD Metrics */}
                    <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-neutral-300 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                      <span>{adasTelemetry?.latency_ms || 0} ms • {adasTelemetry?.fps || 0} FPS</span>
                      <span className="text-sky-300 font-bold">
                        Kare: {adasTelemetry?.frame_no || 0}/{adasTelemetry?.total_frames || '∞'}
                      </span>
                    </div>
                  </div>

                  {/* Camera & Model Control Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1.5">
                      {/* Play / Pause */}
                      <button
                        onClick={onTogglePause}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-all active:scale-95 ${
                          adasTelemetry?.is_paused
                            ? 'bg-emerald-500 text-neutral-950 shadow-md'
                            : 'bg-[#252d3d] hover:bg-[#313b50] text-neutral-200'
                        }`}
                        title={adasTelemetry?.is_paused ? 'Videoyu / Modeli Başlat' : 'Videoyu / Modeli Duraklat'}
                      >
                        {adasTelemetry?.is_paused ? (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Başlat</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            <span>Durdur</span>
                          </>
                        )}
                      </button>

                      {/* Restart from frame 0 */}
                      <button
                        onClick={onRestartVideo}
                        className="p-1.5 rounded-xl bg-[#252d3d] hover:bg-[#313b50] text-neutral-300 hover:text-white transition-all active:scale-95"
                        title="Videoyu Başa Sar (Yeniden Oynat)"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>

                      {/* Source switch (Video vs Webcam) */}
                      <button
                        onClick={() => onSwitchSource?.(adasTelemetry?.source === 'video' ? 'camera' : 'video')}
                        className="px-2 py-1 rounded-xl bg-[#252d3d] hover:bg-[#313b50] text-neutral-300 hover:text-white text-[10px] font-bold flex items-center space-x-1 transition-all"
                        title="Kaynak Değiştir (Test Videosu / Kamera)"
                      >
                        {adasTelemetry?.source === 'camera' ? (
                          <>
                            <Camera className="w-3 h-3 text-sky-400" />
                            <span>Kamera</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-3 h-3 text-sky-400" />
                            <span>Video</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => setMainViewMode(mainViewMode === 'camera' ? 'map' : 'camera')}
                      className="text-sky-400 hover:underline font-bold text-xs shrink-0 ml-1"
                    >
                      {mainViewMode === 'camera' ? 'Harita' : 'Büyük Görünüm'}
                    </button>
                  </div>

                  {/* Status Banner Text */}
                  <div className="text-[11px] truncate">
                    <span className={adasTelemetry?.danger ? 'text-rose-400 font-bold' : 'text-neutral-400'}>
                      {adasTelemetry?.danger
                        ? '⚠️ DİKKAT: Önünüzde çukur var! Yavaşlayın'
                        : adasTelemetry?.warning
                        ? 'İleride çukur var, dikkatli sürün'
                        : 'Ön şerit taranıyor (Yol Açık)'}
                    </span>
                  </div>
                </div>
              ) : (
                /* COMMUNICATION / MESSAGE CARD */
                <div>
                  <div className="flex items-start space-x-3.5">
                    <div className="relative shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                        alt="Heather Travis"
                        className="w-13 h-13 rounded-full object-cover ring-2 ring-neutral-700"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1d9bf0] flex items-center justify-center shadow-md">
                        <MessageSquare className="w-3 h-3 text-white fill-current" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-base text-white truncate">
                        Heather Travis
                      </h3>
                      <p className="text-xs text-neutral-300 truncate mt-0.5">
                        Hey, do you want to grab lunch after your meeting?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-4">
                    <button
                      onClick={handlePlayMessageAudio}
                      className={`flex-1 h-11 rounded-2xl flex items-center justify-center space-x-2 font-bold text-xs transition-all active:scale-95 ${
                        isReadingMessage
                          ? 'bg-sky-500 text-neutral-950 shadow-lg shadow-sky-900/50'
                          : 'bg-[#262f3f] hover:bg-[#313c50] text-neutral-200'
                      }`}
                    >
                      <Play
                        className={`w-4 h-4 fill-current ${
                          isReadingMessage ? 'animate-pulse' : ''
                        }`}
                      />
                      <span>{isReadingMessage ? 'Okunuyor...' : 'Dinle'}</span>
                    </button>

                    <button
                      onClick={() => setShowReplyModal(true)}
                      className="flex-1 h-11 rounded-2xl bg-[#262f3f] hover:bg-[#313c50] text-neutral-200 flex items-center justify-center space-x-2 font-bold text-xs transition-all active:scale-95"
                    >
                      <CornerUpLeft className="w-4 h-4" />
                      <span>Yanıtla</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM CARD: Media Player Card */}
            <div className="bg-[#1b212c] border border-[#273040] rounded-3xl p-4 shadow-xl flex flex-col justify-between transition-all hover:border-[#344055] flex-1 min-h-[220px]">
              <div>
                <div className="flex items-center space-x-3.5">
                  {/* Album Artwork with YouTube Music Badge */}
                  <div className="relative shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80"
                      alt="You got to listen"
                      className="w-14 h-14 rounded-2xl object-cover ring-1 ring-neutral-700 shadow-md"
                    />
                    {/* YouTube Music Red Badge */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                      <Play className="w-2.5 h-2.5 text-white fill-current ml-0.5" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-white truncate">
                      You got to listen
                    </h4>
                    <p className="text-xs text-neutral-300 truncate mt-0.5">
                      Michael Evans
                    </p>
                  </div>
                </div>

                {/* Scrubber Progress Bar */}
                <div className="mt-5 w-full bg-[#2e3748] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${mediaProgress}%` }}
                  />
                </div>
              </div>

              {/* Playback Controls (Previous, Play/Pause, Next, More) */}
              <div className="flex items-center justify-between px-2 pt-4">
                <button
                  onClick={() => setMediaProgress(0)}
                  className="p-2 text-neutral-300 hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => setMediaProgress(0)}
                  className="p-2 text-neutral-300 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>

                <button className="p-2 text-neutral-400 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT VIEWPORT: LIVE GOOGLE MAP OR EXPANDED HD ADAS CAMERA */}
          <div className="flex-1 h-full relative overflow-hidden bg-black">
            {mainViewMode === 'camera' ? (
              /* EXPANDED HD ADAS CAMERA IN MAIN VIEWPORT */
              <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
                <img
                  key={streamRetryKey}
                  src={`${videoFeedUrl}?r=${streamRetryKey}`}
                  alt="Expanded ADAS Camera"
                  className="w-full h-full object-cover"
                  onError={() => {
                    setTimeout(() => setStreamRetryKey((prev) => prev + 1), 2000);
                  }}
                />

                {/* Top-Right: Control Bar & Return to Map Button */}
                <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center space-x-2">
                  {/* Play / Pause */}
                  <button
                    onClick={onTogglePause}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 backdrop-blur-xl border shadow-xl transition-all active:scale-95 ${
                      adasTelemetry?.is_paused
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-emerald-950 animate-pulse'
                        : 'bg-[#12161f]/90 hover:bg-[#1c2331] text-white border-white/10'
                    }`}
                  >
                    {adasTelemetry?.is_paused ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Başlat</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Durdur</span>
                      </>
                    )}
                  </button>

                  {/* Restart */}
                  <button
                    onClick={onRestartVideo}
                    className="p-2.5 rounded-2xl bg-[#12161f]/90 hover:bg-[#1c2331] text-neutral-300 hover:text-white backdrop-blur-xl border border-white/10 shadow-xl transition-all active:scale-95"
                    title="Videoyu Başa Sar (Yeniden Oynat)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Source Switch */}
                  <button
                    onClick={() => onSwitchSource?.(adasTelemetry?.source === 'video' ? 'camera' : 'video')}
                    className="px-3 py-2 rounded-2xl bg-[#12161f]/90 hover:bg-[#1c2331] text-neutral-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 backdrop-blur-xl border border-white/10 shadow-xl transition-all active:scale-95"
                    title="Görüntü Kaynağı (Video / Kamera)"
                  >
                    {adasTelemetry?.source === 'camera' ? (
                      <>
                        <Camera className="w-3.5 h-3.5 text-sky-400" />
                        <span>Kamera</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-3.5 h-3.5 text-sky-400" />
                        <span>test2.mp4</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setMainViewMode('map')}
                    className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#12161f]/90 hover:bg-[#1c2331] text-sky-400 font-bold text-xs backdrop-blur-xl border border-sky-500/40 shadow-2xl transition-all active:scale-95"
                  >
                    <Navigation className="w-4 h-4 fill-current" />
                    <span>Haritaya Dön</span>
                  </button>
                </div>

                {/* Floating Bottom HUD Metrics in HD View */}
                <div className="absolute bottom-4 right-4 z-20 pointer-events-auto flex items-center space-x-3 bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-xs">
                  <div className="flex items-center space-x-1.5 text-neutral-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold">Ön Kamera (YOLOv8s)</span>
                  </div>
                  <span className="text-neutral-500">•</span>
                  <span className="font-mono text-neutral-300">{adasTelemetry?.latency_ms || 0} ms</span>
                  <span className="text-neutral-500">•</span>
                  <span className="font-mono text-neutral-300">{adasTelemetry?.fps || 0} FPS</span>
                  <span className="text-neutral-500">•</span>
                  <span className="font-bold text-rose-400">{adasTelemetry?.pothole_count || 0} Çukur</span>
                </div>
              </div>
            ) : (
              /* GOOGLE MAPS NAVIGATION VIEWPORT */
              <>
                <APIProvider apiKey={apiKey} language="tr" region="TR">
                  <Map
                    id="coolwalk-in-car-map"
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    defaultCenter={currentCarPos}
                    defaultZoom={15}
                    gestureHandling="greedy"
                    disableDefaultUI={true}
                    styles={ANDROID_AUTO_DARK_MAP_STYLE}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <MapCameraUpdater center={currentCarPos} zoom={15} />

                    {/* Electric Blue Route Polyline */}
                    {isNavigating && <RoutePolyline path={routePoints} />}

                    {/* Android Auto Blue Circular Chevron Car Marker */}
                    <AdvancedMarker position={currentCarPos} title="Aracınız">
                      <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        {/* Radar Halo */}
                        <div className="absolute w-14 h-14 rounded-full bg-sky-500/25 animate-ping" />
                        {/* High-gloss Navigation Chevron Circle */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-500 border-2 border-white shadow-[0_4px_16px_rgba(14,165,233,0.7)] flex items-center justify-center">
                          <Navigation className="w-5 h-5 text-white fill-white transform rotate-45 drop-shadow" />
                        </div>
                      </div>
                    </AdvancedMarker>
                  </Map>
                </APIProvider>

                {/* FLOATING ADAS ROAD SAFETY PILL (Top-Right of Map) */}
                <div className="absolute top-4 right-4 z-20 pointer-events-auto">
                  <button
                    onClick={() => setMainViewMode('camera')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl backdrop-blur-xl border shadow-xl transition-all active:scale-95 ${
                      adasTelemetry?.danger
                        ? 'bg-rose-950/90 border-rose-500/80 text-rose-200 animate-pulse'
                        : adasTelemetry?.warning
                        ? 'bg-amber-950/90 border-amber-500/80 text-amber-200'
                        : 'bg-[#151922]/90 border-neutral-700/80 text-neutral-200 hover:border-neutral-500'
                    }`}
                    title="ADAS Ön Görüşü Genişlet"
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        adasTelemetry?.danger
                          ? 'bg-rose-400 animate-ping'
                          : adasTelemetry?.warning
                          ? 'bg-amber-400'
                          : adasConnected
                          ? 'bg-emerald-400'
                          : 'bg-neutral-500'
                      }`}
                    />
                    <Camera className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold">
                      {adasTelemetry?.danger
                        ? 'DİKKAT: ÖNÜNÜZDE ÇUKUR'
                        : adasTelemetry?.warning
                        ? 'İleride Çukur Var'
                        : 'ADAS: Yol Açık'}
                    </span>
                    {adasTelemetry && adasTelemetry.latency_ms > 0 && (
                      <span className="text-[10px] font-mono text-neutral-400 pl-1 border-l border-white/20">
                        {adasTelemetry.latency_ms}ms
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* FLOATING GREEN TURN-BY-TURN CARD (Top-Left of Map) */}
            {isNavigating && (
              <div className="absolute top-4 left-4 z-20 w-[280px] sm:w-[320px] bg-[#0c6b37] text-white rounded-3xl p-4 shadow-2xl border border-[#168a49] pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-start space-x-3.5">
                  {/* Curved Right Turn Arrow */}
                  <div className="shrink-0 pt-0.5">
                    <CornerUpRight className="w-9 h-9 stroke-[3] text-white" />
                  </div>
                  <div>
                    <div className="font-sans text-2xl font-black leading-none tracking-tight">
                      1000 ft
                    </div>
                    <div className="text-sm font-bold text-white/95 mt-1 truncate">
                      {destinationName}
                    </div>
                  </div>
                </div>

                {/* Sub-instruction: Next maneuver */}
                <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center space-x-1.5 text-xs font-semibold text-white/80">
                  <span>Then</span>
                  <CornerUpLeft className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            )}

            {/* FLOATING TRIP DETAILS & TOOLBAR CARD (Bottom-Left of Map) */}
            {isNavigating && (
              <div className="absolute bottom-4 left-4 z-20 w-[290px] sm:w-[330px] bg-[#171d26] text-white rounded-3xl p-4 shadow-2xl border border-[#273040] pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* Top Info Row */}
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => setIsNavigating(false)}
                    className="p-1 -ml-1 text-neutral-400 hover:text-white transition-colors"
                    title="Rotayı İptal Et"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-right">
                    <div className="font-sans text-base font-bold text-white tracking-tight">
                      <span className="text-amber-400 font-extrabold mr-1.5">
                        {remainingTime}
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="ml-1.5">{remainingDistance}</span>
                    </div>
                    <div className="text-xs text-neutral-400 font-medium mt-0.5">
                      {etaText}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Icon Dock (Settings, Alternate Routes, Search, Waypoint, More) */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#263041] text-neutral-300">
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-1.5 rounded-xl hover:bg-neutral-800 hover:text-white transition-colors"
                    title="Rota Ayarları"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setShowRouteOptions(!showRouteOptions)}
                    className="p-1.5 rounded-xl hover:bg-neutral-800 hover:text-sky-400 transition-colors"
                    title="Alternatif Rotalar"
                  >
                    <GitFork className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="p-1.5 rounded-xl hover:bg-neutral-800 hover:text-sky-400 transition-colors"
                    title="Güzergah Üzerinde Ara"
                  >
                    <Search className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="p-1.5 rounded-xl hover:bg-neutral-800 hover:text-sky-400 transition-colors"
                    title="Ara Durak Ekle"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setShowRouteOptions(!showRouteOptions)}
                    className="p-1.5 rounded-xl hover:bg-neutral-800 hover:text-white transition-colors"
                    title="Diğer Seçenekler"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* When navigation is closed, show quick Start Navigation button */}
            {!isNavigating && (
              <div className="absolute bottom-6 left-6 z-20">
                <button
                  onClick={() => setIsNavigating(true)}
                  className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-sm shadow-2xl flex items-center space-x-2 transition-transform active:scale-95"
                >
                  <Navigation className="w-4 h-4 fill-current" />
                  <span>Navigasyonu Yeniden Başlat</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. APP DRAWER OVERLAY (Android Auto Full App Launcher) */}
        {showAppDrawer && (
          <div className="absolute inset-0 bg-[#0f1217]/95 backdrop-blur-2xl z-40 p-8 flex flex-col justify-between animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Grid className="w-6 h-6 text-sky-400" />
                <span>Android Auto Uygulamaları</span>
              </h2>
              <button
                onClick={() => setShowAppDrawer(false)}
                className="p-2 rounded-full bg-neutral-800 text-neutral-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 my-auto max-w-4xl mx-auto w-full py-6">
              {[
                {
                  name: 'ADAS Çukur Tespiti',
                  icon: ShieldAlert,
                  color: 'bg-rose-600',
                  action: () => {
                    setShowAppDrawer(false);
                    onOpenLiveCamera?.();
                  },
                },
                { name: 'Google Haritalar', icon: Navigation, color: 'bg-emerald-600' },
                { name: 'YouTube Music', icon: Play, color: 'bg-red-600' },
                { name: 'Spotify', icon: Music, color: 'bg-emerald-500' },
                { name: 'Telefon', icon: Phone, color: 'bg-blue-600' },
                { name: 'Mesajlar', icon: MessageSquare, color: 'bg-sky-500' },
                { name: 'Hava Durumu', icon: CloudSun, color: 'bg-amber-500' },
                { name: 'Takvim', icon: Calendar, color: 'bg-indigo-600' },
                { name: 'Radyo', icon: Radio, color: 'bg-purple-600' },
                { name: 'Ayarlar', icon: Settings, color: 'bg-neutral-700' },
              ].map((app, idx) => {
                const Icon = app.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (app.action) {
                        app.action();
                      } else {
                        setShowAppDrawer(false);
                      }
                    }}
                    className="flex flex-col items-center space-y-2 group p-2 rounded-2xl hover:bg-white/5 transition-all"
                  >
                    <div
                      className={`w-16 h-16 rounded-3xl ${app.color} flex items-center justify-center text-white shadow-xl shadow-black/40 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-semibold text-neutral-200 text-center truncate w-full">
                      {app.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-center text-xs text-neutral-500">
              AutoDrive OS • Android Auto Coolwalk Mimarisi
            </div>
          </div>
        )}

        {/* 4. GOOGLE ASSISTANT MODAL */}
        {showAssistant && (
          <div className="absolute bottom-6 left-24 sm:left-28 right-6 z-40 bg-[#161b24] border border-[#2b3547] rounded-3xl p-5 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center space-x-4">
              {/* Pulsing Assistant Dots */}
              <div className="flex space-x-1.5 items-center">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-bounce" />
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-bounce delay-100" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-bounce delay-200" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-bounce delay-300" />
              </div>

              <div>
                <div className="text-sm font-bold text-white">
                  Dinliyorum...
                </div>
                <div className="text-xs text-neutral-400">
                  "En yakın şarj istasyonuna rota oluştur" veya "Heather'a mesaj at"
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAssistant(false)}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 5. SEARCH & ROUTE POI MODAL */}
        {showSearchModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#181e28] border border-[#273244] rounded-3xl p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700">
                <h3 className="font-bold text-base text-white flex items-center space-x-2">
                  <Search className="w-5 h-5 text-sky-400" />
                  <span>Güzergah Üzerinde Ara veya Durak Ekle</span>
                </h3>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { name: 'Central Express Way', dist: '8 mi', time: '24 min', eta: '6:58 PM' },
                  { name: 'Tesla Supercharger Maslak', dist: '3.8 km', time: '12 min', eta: '1:15 PM' },
                  { name: 'Shell Akaryakıt & Cafe', dist: '2.1 km', time: '6 min', eta: '1:02 PM' },
                  { name: 'Starbucks Reserve Bebek', dist: '5.4 km', time: '16 min', eta: '1:24 PM' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      handleSelectDestination(item.name, item.dist, item.time, item.eta)
                    }
                    className="p-3 bg-[#202735] hover:bg-[#283244] rounded-2xl border border-neutral-700/60 text-left transition-colors"
                  >
                    <div className="text-xs font-bold text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-sky-400 mt-1 font-mono">
                      {item.dist} • {item.time}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. REPLY MODAL */}
        {showReplyModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#181e28] border border-[#273244] rounded-3xl p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700">
                <span className="font-bold text-sm text-white">
                  Heather Travis'e Yanıt Ver
                </span>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Sesli veya klavyeyle mesaj yazın..."
                  className="w-full bg-[#111620] border border-neutral-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-400"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  onClick={handleSendReply}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 text-xs font-bold flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gönder</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. SETTINGS MODAL */}
        {showSettingsModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#181e28] border border-[#273244] rounded-3xl p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700">
                <span className="font-bold text-sm text-white">
                  Navigasyon ve Araç Ekranı Ayarları
                </span>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-neutral-300">
                <div className="flex items-center justify-between p-3 bg-[#111620] rounded-2xl">
                  <span>Sesli Yönlendirme</span>
                  <span className="font-bold text-emerald-400">Açık</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#111620] rounded-2xl">
                  <span>Trafik Yoğunluğu Katmanı</span>
                  <span className="font-bold text-emerald-400">Canlı</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#111620] rounded-2xl">
                  <span>Hız Radarı Uyarıları</span>
                  <span className="font-bold text-emerald-400">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
