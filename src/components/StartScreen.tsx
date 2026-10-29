/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, WifiOff, RefreshCw, Zap, EyeOff, ShieldAlert, Radio, Volume2, VolumeX } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  highScore: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  isMuted,
  onToggleMute,
  highScore,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-brightness-50 flex items-center justify-center p-4 z-30 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900/95 border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col gap-6 text-white my-auto">
        
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono-code font-bold tracking-widest uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>NEURAL DATAWAY PROTOCOL // 90s SURVIVAL</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-fuchsia-500 tracking-tight text-glow-cyan uppercase">
            Internet Is Broken
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-medium">
            Survive <span className="text-cyan-400 font-bold">90 seconds</span> inside the cyber highway. 
            Dodge servers, jump electric barriers, and slide under laser grids while battling sudden network anomalies!
          </p>

          {highScore > 0 && (
            <div className="text-xs font-mono-code text-amber-400 font-semibold tracking-wider">
              BEST RUN RECORD: {highScore.toLocaleString()} PTS
            </div>
          )}
        </div>

        {/* The 4 Glitches Intel Showcase */}
        <div className="space-y-2.5">
          <div className="text-xs font-mono-code font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>CRITICAL NETWORK ANOMALIES (LASTS 5-7 SECONDS)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-400 shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold font-orbitron text-white">999ms Latency</h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Steering and jump inputs are delayed by 0.4 seconds. Anticipate turns early!
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold font-orbitron text-white">Reversed Polarity</h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Routing circuits invert: Left moves Right, and Right moves Left.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold font-orbitron text-white">Packet Loss</h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Forward speed stutters with unpredictable micro-freezes and hyper surges.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-400 shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold font-orbitron text-white">404 Textures</h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Graphics pipeline crashes into high-contrast magenta & black checkerboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Quick Reference */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">DESKTOP:</span>
            <span>A / D (Steer)</span>
            <span>•</span>
            <span>W / Space (Jump)</span>
            <span>•</span>
            <span>S / Shift (Slide)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-cyan-400 font-bold">MOBILE:</span>
            <span>Swipe Left / Right / Up / Down</span>
          </div>
        </div>

        {/* Action Controls & Sound Toggle */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            onClick={onToggleMute}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 text-xs font-mono-code transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}</span>
          </button>

          <button
            onClick={onStart}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 active:scale-[0.98] font-orbitron font-black text-slate-950 tracking-wider text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all cursor-pointer uppercase"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>JACK INTO DATAWAY</span>
          </button>
        </div>

      </div>
    </div>
  );
};
