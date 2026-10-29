/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, PlayerStats } from './types/game';
import { soundManager } from './audio/SoundManager';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { PauseScreen } from './components/PauseScreen';
import { MobileControls } from './components/MobileControls';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('START');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('cyber_runner_high_score')) || 0;
    } catch {
      return 0;
    }
  });

  const [stats, setStats] = useState<PlayerStats>({
    lives: 3,
    maxLives: 3,
    score: 0,
    packetsCollected: 0,
    timeRemaining: 90.0,
    totalTime: 90.0,
    distance: 0,
    speed: 80,
    currentPing: 28,
    glitchPhase: 'NONE',
    activeGlitch: null,
    glitchCountdown: 0,
    isInvulnerable: false,
    invulnerabilityTimer: 0,
  });

  // Track high scores
  useEffect(() => {
    if (stats.score > highScore) {
      setHighScore(stats.score);
      try {
        localStorage.setItem('cyber_runner_high_score', String(stats.score));
      } catch {
        // Storage fallback
      }
    }
  }, [stats.score, highScore]);

  // Three.js Game Engine Initialization
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onStateChange: (newState) => {
        setGameState(newState);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Action Handlers
  const handleStartGame = useCallback(() => {
    engineRef.current?.startGame();
    setGameState('PLAYING');
  }, []);

  const handlePauseGame = useCallback(() => {
    engineRef.current?.pauseGame();
    setGameState('PAUSED');
  }, []);

  const handleResumeGame = useCallback(() => {
    engineRef.current?.resumeGame();
    setGameState('PLAYING');
  }, []);

  const handleRestartGame = useCallback(() => {
    engineRef.current?.restartGame();
    setGameState('PLAYING');
  }, []);

  const handleHome = useCallback(() => {
    setGameState('START');
    soundManager.stopMusic();
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Mobile control proxies
  const handleMobileJump = useCallback(() => {
    engineRef.current?.triggerJump();
  }, []);

  const handleMobileSlide = useCallback(() => {
    engineRef.current?.triggerSlide();
  }, []);

  const handleMobileSteer = useCallback((dir: 'left' | 'right' | 'none') => {
    engineRef.current?.setLateralInput(dir);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Dedicated Three.js WebGL Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Cyberpunk Scanlines & Vignette Overlay */}
      <div className="absolute inset-0 cyber-scanlines pointer-events-none z-10 opacity-70" />

      {/* 404 Glitch Screen Flash Accent */}
      {stats.glitchPhase === 'ACTIVE' && stats.activeGlitch === 'TEXTURE_404' && (
        <div className="absolute inset-0 border-8 border-fuchsia-500/50 pointer-events-none z-10 glitch-active" />
      )}

      {/* Connection Unstable Warning Border Pulse */}
      {stats.glitchPhase === 'WARNING' && (
        <div className="absolute inset-0 border-8 border-rose-500/60 pointer-events-none z-10 animate-pulse" />
      )}

      {/* HUD active during running */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <GameHUD
          stats={stats}
          onPause={handlePauseGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Mobile Touch & Swipe Controls */}
      {gameState === 'PLAYING' && (
        <MobileControls
          onJump={handleMobileJump}
          onSlide={handleMobileSlide}
          onSteer={handleMobileSteer}
        />
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <StartScreen
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          highScore={highScore}
        />
      )}

      {/* Paused Screen */}
      {gameState === 'PAUSED' && (
        <PauseScreen
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onHome={handleHome}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAMEOVER' && (
        <GameOverScreen
          stats={stats}
          onRestart={handleRestartGame}
          onHome={handleHome}
        />
      )}

      {/* Victory Screen (90s Survival) */}
      {gameState === 'VICTORY' && (
        <VictoryScreen
          stats={stats}
          onRestart={handleRestartGame}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
