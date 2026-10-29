/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats } from '../types/game';
import { Trophy, RotateCcw, Home, Award, Zap, ShieldCheck } from 'lucide-react';

interface VictoryScreenProps {
  stats: PlayerStats;
  onRestart: () => void;
  onHome: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  stats,
  onRestart,
  onHome,
}) => {
  useEffect(() => {
    // Fire celebratory cyberpunk confetti burst
    const end = Date.now() + 3000;
    const colors = ['#00f3ff', '#38bdf8', '#10b981', '#f43f5e', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Cyber Rank rating
  let rank = 'S-TIER CYBERNETIC DEITY';
  let rankColor = 'text-amber-400';
  if (stats.lives === 3) {
    rank = 'PERFECT 100% UNTOUCHED (ELITE S+)';
    rankColor = 'text-cyan-400 text-glow-cyan';
  } else if (stats.lives === 1) {
    rank = 'SURVIVOR CLASS (A-TIER)';
    rankColor = 'text-emerald-400';
  }

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-brightness-50 flex items-center justify-center p-4 z-30">
      <div className="max-w-md w-full bg-slate-900/95 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.4)] flex flex-col gap-6 text-white text-center">
        
        {/* Trophy Icon */}
        <div className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-950/90 border border-emerald-400/80 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)]">
            <Trophy className="w-9 h-9" />
          </div>

          <div className="text-xs font-mono-code font-bold tracking-widest text-emerald-400 uppercase">
            90.0 SECONDS SURVIVED // FULL ROUTE OVERRIDDEN
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-200 to-emerald-400 uppercase">
            SYSTEM OVERRIDDEN!
          </h2>

          <div className={`text-xs font-mono-code font-bold tracking-wider ${rankColor}`}>
            RANK: {rank}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono-code mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>FINAL SCORE</span>
            </div>
            <div className="text-2xl font-black font-orbitron text-white text-glow-cyan">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono-code mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVES REMAINING</span>
            </div>
            <div className="text-2xl font-black font-orbitron text-white">
              {stats.lives} / {stats.maxLives}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono-code mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>PACKETS HARVESTED</span>
            </div>
            <div className="text-2xl font-black font-orbitron text-white">
              {stats.packetsCollected}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono-code mb-1">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              <span>METERS RUN</span>
            </div>
            <div className="text-2xl font-black font-orbitron text-white">
              {stats.distance}m
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-orbitron font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer uppercase"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RUN AGAIN</span>
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
