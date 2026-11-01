import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  Heart,
  Radio,
  Music,
  ListMusic,
} from 'lucide-react';
import { MediaTrack } from '../types/automotive';
import { MOCK_PLAYLIST } from '../data/mockData';

interface MediaAppProps {
  currentTrack: MediaTrack;
  setCurrentTrack: (track: MediaTrack) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
}

export const MediaApp: React.FC<MediaAppProps> = ({
  currentTrack,
  setCurrentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  volume,
  onChangeVolume,
}) => {
  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col md:flex-row gap-6 overflow-y-auto select-none">
      {/* Left: Now Playing Hero Vinyl / Card */}
      <div className="flex-1 bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
        {/* Ambient album glow */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
        />

        <div className="relative group">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl object-cover shadow-2xl border-2 border-slate-700/60"
          />
          <button className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-rose-400 hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 fill-current" />
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {currentTrack.title}
          </h2>
          <p className="text-sm font-semibold text-cyan-400 mt-1">
            {currentTrack.artist}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentTrack.album}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mt-6 space-y-1.5">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-2/5 rounded-full" />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>1:34</span>
            <span>3:54</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-6 mt-6">
          <button className="text-slate-400 hover:text-white transition-colors">
            <Shuffle className="w-5 h-5" />
          </button>
          <button
            onClick={onPrevTrack}
            className="text-slate-200 hover:text-cyan-400 p-2 transition-colors active:scale-95"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xl shadow-cyan-900/50 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>
          <button
            onClick={onNextTrack}
            className="text-slate-200 hover:text-cyan-400 p-2 transition-colors active:scale-95"
          >
            <SkipForward className="w-6 h-6" />
          </button>
          <button className="text-slate-400 hover:text-white transition-colors">
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center space-x-3 w-full max-w-xs mt-6 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => onChangeVolume(Number(e.target.value))}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-xs text-slate-300 w-8 text-right">
            %{volume}
          </span>
        </div>
      </div>

      {/* Right: Car Radio & Playlist Channels */}
      <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl flex flex-col shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <ListMusic className="w-5 h-5 text-cyan-400" />
            <span>Araç Ses & Çalma Listesi</span>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
            Hi-Fi Dolby Atmos
          </span>
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {MOCK_PLAYLIST.map((track) => {
            const isCurrent = track.id === currentTrack.id;
            return (
              <button
                key={track.id}
                onClick={() => {
                  setCurrentTrack(track);
                  if (!isPlaying) onTogglePlay();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">
                      {track.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {track.artist} • {track.album}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isCurrent && isPlaying && (
                    <span className="flex space-x-0.5 items-end h-4">
                      <span className="w-1 bg-cyan-400 h-2 animate-bounce" />
                      <span className="w-1 bg-cyan-400 h-4 animate-bounce delay-100" />
                      <span className="w-1 bg-cyan-400 h-3 animate-bounce delay-200" />
                    </span>
                  )}
                  <span className="font-mono text-xs text-slate-400">
                    {Math.floor(track.durationSeconds / 60)}:
                    {(track.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
