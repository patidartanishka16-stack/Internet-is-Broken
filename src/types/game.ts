/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type GlitchType = 'PING' | 'POLARITY' | 'PACKET_LOSS' | 'TEXTURE_404';

export interface GlitchEvent {
  type: GlitchType;
  name: string;
  description: string;
  warningDuration: number; // 2 seconds
  activeDuration: number;  // 5-7 seconds
}

export type ObstacleType = 'TALL_BARRIER' | 'LOW_WALL' | 'LASER_OVERHANG' | 'DATA_CRYSTAL';

export interface ObstacleInstance {
  id: number;
  type: ObstacleType;
  group: import('three').Group;
  collider: import('three').Box3;
  z: number;
  x: number;
  passed: boolean;
  collected?: boolean;
}

export interface PlayerStats {
  lives: number;
  maxLives: number;
  score: number;
  packetsCollected: number;
  timeRemaining: number; // starts at 90.0s
  totalTime: number;      // 90.0s
  distance: number;
  speed: number;
  currentPing: number;    // simulated latency in ms
  glitchPhase: 'NONE' | 'WARNING' | 'ACTIVE';
  activeGlitch: GlitchType | null;
  glitchCountdown: number;
  isInvulnerable: boolean;
  invulnerabilityTimer: number;
}

export interface InputCommand {
  left: boolean;
  right: boolean;
  jump: boolean;
  slide: boolean;
  timestamp: number;
}
