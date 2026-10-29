/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface MobileControlsProps {
  onJump: () => void;
  onSlide: () => void;
  onSteer: (dir: 'left' | 'right' | 'none') => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJump,
  onSlide,
  onSteer,
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Swipe detection over window
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // If touching the explicit buttons, let button handler deal with it
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;

      const touch = e.changedTouches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      // Minimum swipe distance
      const minDistance = 35;
      if (duration > 600) return; // Too slow for swipe

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < -minDistance) {
          // Swipe Up -> Jump
          onJump();
        } else if (deltaY > minDistance) {
          // Swipe Down -> Slide
          onSlide();
        }
      } else {
        if (deltaX < -minDistance) {
          // Swipe Left
          onSteer('left');
          setTimeout(() => onSteer('none'), 220);
        } else if (deltaX > minDistance) {
          // Swipe Right
          onSteer('right');
          setTimeout(() => onSteer('none'), 220);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onJump, onSlide, onSteer]);

  return (
    <div className="sm:hidden absolute bottom-4 inset-x-4 flex justify-between items-end pointer-events-none z-20">
      {/* Left/Right Steer D-Pad */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); onSteer('left'); }}
          onTouchEnd={(e) => { e.preventDefault(); onSteer('none'); }}
          onMouseDown={() => onSteer('left')}
          onMouseUp={() => onSteer('none')}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-cyan-500/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400 active:scale-95 transition-transform shadow-lg shadow-cyan-950/40"
          aria-label="Steer Left"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>

        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); onSteer('right'); }}
          onTouchEnd={(e) => { e.preventDefault(); onSteer('none'); }}
          onMouseDown={() => onSteer('right')}
          onMouseUp={() => onSteer('none')}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-cyan-500/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400 active:scale-95 transition-transform shadow-lg shadow-cyan-950/40"
          aria-label="Steer Right"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Action buttons: Jump & Slide */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={onSlide}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-amber-500/30 border border-amber-500/50 flex flex-col items-center justify-center text-amber-400 active:scale-95 transition-transform shadow-lg shadow-amber-950/40"
          aria-label="Slide"
        >
          <ArrowDown className="w-6 h-6" />
          <span className="text-[9px] font-mono-code font-bold uppercase">SLIDE</span>
        </button>

        <button
          type="button"
          onClick={onJump}
          className="w-14 h-14 rounded-2xl bg-cyan-600/80 active:bg-cyan-400/80 border border-cyan-300 flex flex-col items-center justify-center text-white active:scale-95 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          aria-label="Jump"
        >
          <ArrowUp className="w-6 h-6" />
          <span className="text-[9px] font-mono-code font-bold uppercase">JUMP</span>
        </button>
      </div>
    </div>
  );
};
