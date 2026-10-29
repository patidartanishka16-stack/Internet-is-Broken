/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({
  onResume,
  onRestart,
  onHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-brightness-50 flex items-center justify-center p-4 z-30">
      <div className="max-w-sm w-full bg-slate-900/95 border-2 border-cyan-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col gap-5 text-white text-center">
        
        <div className="space-y-1">
          <div className="text-xs font-mono-code font-bold tracking-widest text-cyan-400 uppercase">
            SIMULATION SUSPENDED
          </div>
          <h2 className="text-3xl font-black font-orbitron text-white text-glow-cyan">
            PAUSED
          </h2>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onResume}
            className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-orbitron font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 transition-all cursor-pointer uppercase"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME RUN</span>
          </button>

          <button
            onClick={onRestart}
            className="py-3 px-5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-mono-code text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer uppercase"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>

          <button
            onClick={onToggleMute}
            className="py-3 px-5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-mono-code text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onHome}
            className="py-3 px-5 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-white font-mono-code text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};
