/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats } from '../types/game';
import { Activity, AlertTriangle, Shield, Wifi, Zap, Pause, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface GameHUDProps {
  stats: PlayerStats;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  onPause,
  isMuted,
  onToggleMute,
}) => {
  const timeFormatted = stats.timeRemaining.toFixed(1);
  const progressPercent = Math.min(100, Math.max(0, ((stats.totalTime - stats.timeRemaining) / stats.totalTime) * 100));

  // Determine ping color indicator
  const pingColor = stats.currentPing > 500
    ? 'text-rose-500 border-rose-500/50 bg-rose-950/40'
    : stats.currentPing > 120
    ? 'text-amber-400 border-amber-400/50 bg-amber-950/40'
    : 'text-emerald-400 border-emerald-400/50 bg-emerald-950/40';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Bar: Timer, Lives, Score, Ping */}
      <div className="flex items-start justify-between gap-4 w-full max-w-6xl mx-auto">
        
        {/* Left: Health / Lives & Distance */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Cyber Energy Shield Bars */}
          <div className="bg-slate-900/85 border border-cyan-500/40 rounded-xl px-4 py-2.5 shadow-lg shadow-cyan-950/30">
            <div className="text-[10px] tracking-widest text-cyan-400/80 font-mono-code font-bold uppercase mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>CORE INTEGRITY</span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: stats.maxLives }).map((_, idx) => {
                const isActive = idx < stats.lives;
                return (
                  <div
                    key={idx}
                    className={`h-4 w-9 rounded-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] border border-cyan-200'
                        : 'bg-slate-800/80 border border-slate-700/50 opacity-40'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Packets Collected */}
          <div className="bg-slate-900/85 border border-slate-700/60 rounded-xl px-3.5 py-1.5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300 font-mono-code font-semibold">
              PACKETS: <span className="text-emerald-400 font-bold">{stats.packetsCollected}</span>
            </span>
          </div>
        </div>

        {/* Center: High-Impact Countdown Timer */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="bg-slate-900/90 border-2 border-cyan-500/60 rounded-2xl px-6 py-2.5 shadow-[0_0_25px_rgba(6,182,212,0.3)] text-center min-w-[200px]">
            <span className="text-[11px] font-mono-code tracking-[0.2em] text-cyan-400 font-bold block uppercase">
              RESTORATION COUNTDOWN
            </span>
            <div className="text-3xl sm:text-4xl font-black font-orbitron text-white text-glow-cyan tracking-wider">
              {timeFormatted} <span className="text-sm font-mono-code text-cyan-400 font-normal">s</span>
            </div>
            {/* Progress Bar to 90s Victory */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Score, Ping Monitor, Audio & Pause */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Score Card */}
          <div className="bg-slate-900/85 border border-cyan-500/40 rounded-xl px-4 py-2.5 text-right shadow-lg shadow-cyan-950/30 min-w-[130px]">
            <div className="text-[10px] tracking-widest text-cyan-400/80 font-mono-code font-bold uppercase mb-0.5">
              DATA STREAM
            </div>
            <div className="text-xl sm:text-2xl font-black font-orbitron text-white">
              {stats.score.toLocaleString()}
            </div>
          </div>

          {/* Ping & Utility buttons */}
          <div className="flex items-center gap-2">
            {/* Ping Indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono-code font-bold ${pingColor}`}>
              <Wifi className="w-3.5 h-3.5" />
              <span>{stats.currentPing} ms</span>
            </div>

            {/* Mute button */}
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Pause button */}
            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
              title="Pause Game"
            >
              <Pause className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Middle Banner: Glitch Warning & Active Glitch Notification */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        
        {/* WARNING Phase (2 seconds countdown) */}
        {stats.glitchPhase === 'WARNING' && (
          <div className="animate-pulse flex flex-col items-center bg-rose-950/85 border-2 border-rose-500 rounded-2xl px-8 py-4 shadow-[0_0_35px_rgba(244,63,94,0.6)] text-center max-w-md mx-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold tracking-widest text-sm font-mono-code uppercase mb-1">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              <span>SYSTEM ANOMALY IMMINENT</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-orbitron text-rose-100 text-glow-pink">
              CONNECTION UNSTABLE
            </div>
            <div className="text-xs font-mono-code text-rose-300 mt-1">
              SIGNAL COLLAPSE IN: {stats.glitchCountdown}s
            </div>
          </div>
        )}

        {/* ACTIVE GLITCH Phase */}
        {stats.glitchPhase === 'ACTIVE' && (
          <div className="flex flex-col items-center bg-slate-950/95 border-2 border-amber-500 rounded-2xl px-7 py-3.5 shadow-[0_0_35px_rgba(245,158,11,0.5)] text-center max-w-lg mx-4">
            <div className="flex items-center gap-2 text-amber-400 font-mono-code font-bold tracking-wider text-xs uppercase mb-1">
              <Activity className="w-4 h-4 animate-spin text-amber-400" />
              <span>GLITCH ACTIVE ({stats.glitchCountdown}s REMAINING)</span>
            </div>

            {stats.activeGlitch === 'PING' && (
              <>
                <div className="text-xl sm:text-2xl font-black font-orbitron text-amber-300 text-glow-amber">
                  999ms SEVERE LATENCY
                </div>
                <p className="text-xs font-mono-code text-amber-200/90 mt-0.5">
                  Input buffer delayed by 400ms! Anticipate obstacle movements!
                </p>
              </>
            )}

            {stats.activeGlitch === 'POLARITY' && (
              <>
                <div className="text-xl sm:text-2xl font-black font-orbitron text-rose-400 text-glow-pink">
                  REVERSED POLARITY
                </div>
                <p className="text-xs font-mono-code text-rose-200 mt-0.5">
                  Controls inverted: LEFT is RIGHT, RIGHT is LEFT!
                </p>
              </>
            )}

            {stats.activeGlitch === 'PACKET_LOSS' && (
              <>
                <div className="text-xl sm:text-2xl font-black font-orbitron text-amber-400 text-glow-amber">
                  PACKET LOSS BURSTS
                </div>
                <p className="text-xs font-mono-code text-amber-200 mt-0.5">
                  Runner velocity stuttering and sudden burst surges!
                </p>
              </>
            )}

            {stats.activeGlitch === 'TEXTURE_404' && (
              <>
                <div className="text-xl sm:text-2xl font-black font-orbitron text-fuchsia-400">
                  404 TEXTURES MISSING
                </div>
                <p className="text-xs font-mono-code text-fuchsia-200 mt-0.5">
                  Visual buffer lost: rendering missing checkerboard pattern!
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Hint Banner (Desktop keyboard / controls reminder) */}
      <div className="hidden sm:flex justify-center items-center pb-2 pointer-events-none">
        <div className="bg-slate-950/70 border border-slate-800 rounded-full px-5 py-1.5 flex items-center gap-6 text-[11px] font-mono-code text-slate-400">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">A</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">D</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">→</kbd> Steer</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">W</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">Space</kbd> Jump Low Walls</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">S</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">Shift</kbd> Slide Under Lasers</span>
        </div>
      </div>
    </div>
  );
};
