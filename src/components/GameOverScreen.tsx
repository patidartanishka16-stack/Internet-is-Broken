/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats } from '../types/game';
import { RotateCcw, Home, Skull, Clock, Zap, Flag } from 'lucide-react';

interface GameOverScreenProps {
  stats: PlayerStats;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  onRestart,
  onHome,
}) => {
  const timeSurvived = (stats.totalTime - stats.timeRemaining).toFixed(1);
  const completionPercent = Math.min(100, Math.floor(((stats.totalTime - stats.timeRemaining) / stats.totalTime) * 100));

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-brightness-50 flex items-center justify-center p-4 z-30">
      <div className="max-w-md w-full bg-slate-900/95 border-2 border-rose-500/70 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.4)] flex flex-col gap-6 text-white text-center">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
            <Skull className="w-8 h-8" />
          </div>

          <div className="text-xs font-mono-code font-bold tracking-widest text-rose-400 uppercase">
            FATAL HARDWARE INTERRUPT // DISCONNECTED
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-orbitron text-white text-glow-pink uppercase">
            SIGNAL TERMINATED
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono-code mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>TIME SURVIVED</span>
            </div>
            <div className="text-xl font-bold font-orbitron text-white">
              {timeSurvived}s <span className="text-xs font-mono-code text-cyan-400">({completionPercent}%)</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono-code mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>DATA HARVEST</span>
            </div>
            <div className="text-xl font-bold font-orbitron text-white">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono-code mb-1">
              <Flag className="w-3.5 h-3.5 text-emerald-400" />
              <span>DISTANCE</span>
            </div>
            <div className="text-xl font-bold font-orbitron text-white">
              {stats.distance} <span className="text-xs font-mono-code text-slate-400">m</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono-code mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>PACKETS CACHED</span>
            </div>
            <div className="text-xl font-bold font-orbitron text-white">
              {stats.packetsCollected}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 font-orbitron font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.5)] active:scale-95 transition-all cursor-pointer uppercase"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RECONNECT RUN</span>
          </button>

          <button
            onClick={onHome}
            className="py-3.5 px-5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white font-mono-code text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};
