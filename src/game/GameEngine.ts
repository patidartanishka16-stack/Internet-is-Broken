/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GameState, GlitchType, InputCommand, PlayerStats } from '../types/game';
import { PlayerMesh } from './PlayerMesh';
import { ObstacleManager } from './ObstacleManager';
import { TunnelManager } from './TunnelManager';
import { soundManager } from '../audio/SoundManager';

/**
 * Three.js Game Engine for "Internet Is Broken"
 */
export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean = false;

  // Game actors
  private player: PlayerMesh;
  private obstacles: ObstacleManager;
  private tunnel: TunnelManager;

  // Lighting
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Loop & timing
  private frameId: number = 0;
  private clock: THREE.Clock;
  private isRunning: boolean = false;
  private gameState: GameState = 'START';
  private onStatsUpdate?: (stats: PlayerStats) => void;
  private onStateChange?: (state: GameState) => void;

  // Player physics state
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private lateralVelocity: number = 0;
  private verticalVelocity: number = 0;
  private isGrounded: boolean = true;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private readonly maxSlideDuration: number = 0.72;
  private readonly jumpForce: number = 11.2;
  private readonly gravity: number = -32.0;
  private readonly trackBound: number = 3.65; // lateral boundary

  // Speed and progression
  private baseSpeed: number = 22.0;
  private currentSpeed: number = 22.0;
  private distance: number = 0;
  private score: number = 0;
  private packetsCollected: number = 0;
  private lives: number = 3;
  private readonly maxLives: number = 3;
  private timeRemaining: number = 90.0;
  private readonly totalTime: number = 90.0;

  // Invulnerability
  private isInvulnerable: boolean = false;
  private invulnerabilityTimer: number = 0;

  // Camera shake
  private cameraShakeIntensity: number = 0;

  // Glitch State Machine
  // 12s initial peace -> Warning (2s) -> Active Glitch (6s) -> Cooldown (10s)
  private glitchPhase: 'NONE' | 'WARNING' | 'ACTIVE' = 'NONE';
  private activeGlitch: GlitchType | null = null;
  private glitchTimer: number = 12.0; // countdown to next phase
  private nextGlitchType: GlitchType = 'PING';
  private packetLossStutterTimer: number = 0;
  private packetLossMultiplier: number = 1.0;

  // Input Handling & 999ms Ping Queue
  private rawInput = { left: false, right: false, jump: false, slide: false };
  private inputQueue: InputCommand[] = [];
  private readonly pingDelaySeconds: number = 0.40; // 400ms delay for 999ms ping glitch

  constructor(
    container: HTMLElement,
    callbacks: {
      onStatsUpdate: (stats: PlayerStats) => void;
      onStateChange: (state: GameState) => void;
    }
  ) {
    this.container = container;
    this.onStatsUpdate = callbacks.onStatsUpdate;
    this.onStateChange = callbacks.onStateChange;

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);
    this.scene.fog = new THREE.FogExp2(0x030712, 0.02);

    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 250);
    this.camera.position.set(0, 3.2, 5.5);

    // 3. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    // Mount canvas
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 4. RoomEnvironment for metallic reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback
    }

    // 5. Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.keyLight.position.set(5, 12, 8);
    this.keyLight.castShadow = !this.isSoftwareGl;
    if (this.keyLight.castShadow) {
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 0.5;
      this.keyLight.shadow.camera.far = 40;
      this.keyLight.shadow.camera.left = -8;
      this.keyLight.shadow.camera.right = 8;
      this.keyLight.shadow.camera.top = 8;
      this.keyLight.shadow.camera.bottom = -8;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);

    // 6. Game Actors
    this.player = new PlayerMesh();
    this.scene.add(this.player.group);

    this.tunnel = new TunnelManager(this.scene, this.renderer);
    this.obstacles = new ObstacleManager(this.scene);

    this.clock = new THREE.Clock();

    // 7. Event Listeners
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Pre-warm compile
    if (!this.isSoftwareGl) {
      try {
        this.renderer.compile(this.scene, this.camera);
      } catch {
        // Pass
      }
    }

    // Initial render call
    this.renderer.render(this.scene, this.camera);
  }

  // --- Public Control APIs ---

  public startGame(): void {
    soundManager.init();
    soundManager.startMusic();
    this.resetState();
    this.gameState = 'PLAYING';
    this.onStateChange?.('PLAYING');
    this.clock.start();
    if (!this.isRunning) {
      this.isRunning = true;
      this.tick();
    }
  }

  public pauseGame(): void {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'PAUSED';
    this.onStateChange?.('PAUSED');
  }

  public resumeGame(): void {
    if (this.gameState !== 'PAUSED') return;
    this.gameState = 'PLAYING';
    this.onStateChange?.('PLAYING');
    this.clock.start();
  }

  public restartGame(): void {
    this.startGame();
  }

  /**
   * Mobile touch / button controls support
   */
  public triggerJump(): void {
    this.queueAction('jump');
  }

  public triggerSlide(): void {
    this.queueAction('slide');
  }

  public setLateralInput(direction: 'left' | 'right' | 'none'): void {
    if (direction === 'left') {
      this.rawInput.left = true;
      this.rawInput.right = false;
    } else if (direction === 'right') {
      this.rawInput.left = false;
      this.rawInput.right = true;
    } else {
      this.rawInput.left = false;
      this.rawInput.right = false;
    }
    this.pushInputRecord();
  }

  private queueAction(action: 'jump' | 'slide'): void {
    if (this.gameState !== 'PLAYING') return;
    if (action === 'jump') {
      this.rawInput.jump = true;
      this.pushInputRecord();
      setTimeout(() => { this.rawInput.jump = false; }, 80);
    } else if (action === 'slide') {
      this.rawInput.slide = true;
      this.pushInputRecord();
      setTimeout(() => { this.rawInput.slide = false; }, 80);
    }
  }

  // --- Input Management & Ping Buffer ---

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();

    if (key === 'escape' || key === 'p') {
      if (this.gameState === 'PLAYING') this.pauseGame();
      else if (this.gameState === 'PAUSED') this.resumeGame();
      return;
    }

    if (this.gameState !== 'PLAYING') return;

    if (key === 'arrowleft' || key === 'a') {
      this.rawInput.left = true;
    } else if (key === 'arrowright' || key === 'd') {
      this.rawInput.right = true;
    } else if (key === 'arrowup' || key === 'w' || key === ' ') {
      this.rawInput.jump = true;
    } else if (key === 'arrowdown' || key === 's' || key === 'shift') {
      this.rawInput.slide = true;
    }

    this.pushInputRecord();
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') {
      this.rawInput.left = false;
    } else if (key === 'arrowright' || key === 'd') {
      this.rawInput.right = false;
    } else if (key === 'arrowup' || key === 'w' || key === ' ') {
      this.rawInput.jump = false;
    } else if (key === 'arrowdown' || key === 's' || key === 'shift') {
      this.rawInput.slide = false;
    }

    this.pushInputRecord();
  };

  private pushInputRecord(): void {
    const now = performance.now() / 1000;
    this.inputQueue.push({
      left: this.rawInput.left,
      right: this.rawInput.right,
      jump: this.rawInput.jump,
      slide: this.rawInput.slide,
      timestamp: now,
    });

    // Prune input buffer older than 2 seconds
    while (this.inputQueue.length > 0 && this.inputQueue[0].timestamp < now - 2.0) {
      this.inputQueue.shift();
    }
  }

  /**
   * Retrieves effective inputs, applying 999ms Ping Delay and Reversed Polarity glitches
   */
  private getEffectiveInput(): { left: boolean; right: boolean; jump: boolean; slide: boolean } {
    let inp = { ...this.rawInput };

    // Glitch 1: 999ms Ping Delay (0.40s lag queue)
    if (this.glitchPhase === 'ACTIVE' && this.activeGlitch === 'PING') {
      const targetTime = (performance.now() / 1000) - this.pingDelaySeconds;
      let matched = this.inputQueue[0];
      for (let i = this.inputQueue.length - 1; i >= 0; i--) {
        if (this.inputQueue[i].timestamp <= targetTime) {
          matched = this.inputQueue[i];
          break;
        }
      }
      if (matched) {
        inp = {
          left: matched.left,
          right: matched.right,
          jump: matched.jump,
          slide: matched.slide,
        };
      }
    }

    // Glitch 2: Reversed Polarity (Left is Right, Right is Left)
    if (this.glitchPhase === 'ACTIVE' && this.activeGlitch === 'POLARITY') {
      const temp = inp.left;
      inp.left = inp.right;
      inp.right = temp;
    }

    return inp;
  }

  // --- Reset & State Setup ---

  private resetState(): void {
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.lateralVelocity = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;

    this.distance = 0;
    this.score = 0;
    this.packetsCollected = 0;
    this.lives = this.maxLives;
    this.timeRemaining = this.totalTime;
    this.currentSpeed = this.baseSpeed;

    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.cameraShakeIntensity = 0;

    this.glitchPhase = 'NONE';
    this.activeGlitch = null;
    this.glitchTimer = 12.0; // 12 seconds warm up
    this.packetLossMultiplier = 1.0;

    this.rawInput = { left: false, right: false, jump: false, slide: false };
    this.inputQueue = [];

    this.player.group.position.set(0, 0, 0);
    this.player.group.rotation.set(0, 0, 0);
    this.player.isSliding = false;
    this.player.isJumping = false;

    this.obstacles.reset();
    this.tunnel.reset();
  }

  // --- Main Tick & Simulation ---

  private tick = (): void => {
    if (!this.isRunning) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.gameState === 'PLAYING') {
      this.updateSimulation(delta);
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);

    // Software WebGL pacing or rAF
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateSimulation(delta: number): void {
    // 1. Time Remaining & Victory Check (90 seconds survival)
    this.timeRemaining = Math.max(0, this.timeRemaining - delta);
    if (this.timeRemaining <= 0) {
      this.triggerVictory();
      return;
    }

    // 2. Progression: Difficulty / Speed scaling
    // Scales from baseSpeed (22) up to ~38 units/s as time progresses
    const progress = 1.0 - (this.timeRemaining / this.totalTime); // 0.0 to 1.0
    const targetSpeed = this.baseSpeed + (progress * 16.0);

    // Glitch 3: Packet Loss (stutters and sudden bursts)
    if (this.glitchPhase === 'ACTIVE' && this.activeGlitch === 'PACKET_LOSS') {
      this.packetLossStutterTimer -= delta;
      if (this.packetLossStutterTimer <= 0) {
        // Randomly alternate between micro-freeze (0.1x speed) and turbo burst (1.7x speed)
        const stutterType = Math.random();
        if (stutterType < 0.45) {
          this.packetLossMultiplier = 0.15; // micro-freeze
          this.packetLossStutterTimer = 0.18 + Math.random() * 0.15;
          this.cameraShakeIntensity = 0.25;
        } else if (stutterType < 0.8) {
          this.packetLossMultiplier = 1.65; // burst
          this.packetLossStutterTimer = 0.25 + Math.random() * 0.2;
        } else {
          this.packetLossMultiplier = 1.0;
          this.packetLossStutterTimer = 0.2;
        }
      }
    } else {
      this.packetLossMultiplier = 1.0;
    }

    this.currentSpeed = targetSpeed * this.packetLossMultiplier;

    // 3. Glitch State Machine
    this.updateGlitchMachine(delta);

    // 4. Player Input & Physics
    const input = this.getEffectiveInput();

    // Lateral movement (smooth acceleration & damping)
    const lateralSpeed = 16.0;
    let targetLatVel = 0;
    if (input.left) targetLatVel -= lateralSpeed;
    if (input.right) targetLatVel += lateralSpeed;

    this.lateralVelocity = THREE.MathUtils.damp(this.lateralVelocity, targetLatVel, 18, delta);
    this.playerX += this.lateralVelocity * delta;

    // Clamp inside track boundary with bounce cushioning
    if (this.playerX < -this.trackBound) {
      this.playerX = -this.trackBound;
      this.lateralVelocity = 0;
    } else if (this.playerX > this.trackBound) {
      this.playerX = this.trackBound;
      this.lateralVelocity = 0;
    }

    // Jump & Slide Handling
    if (input.jump && this.isGrounded && !this.isSliding) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
      soundManager.playJump();
    }

    if (input.slide && this.isGrounded && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.maxSlideDuration;
      soundManager.playSlide();
    }

    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Vertical physics (gravity)
    if (!this.isGrounded) {
      this.verticalVelocity += this.gravity * delta;
      this.playerY += this.verticalVelocity * delta;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Forward run position along -Z
    this.playerZ -= this.currentSpeed * delta;
    this.distance += this.currentSpeed * delta;
    this.score = Math.floor(this.distance * 10) + (this.packetsCollected * 150);

    // Update Player Mesh
    this.player.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.player.isSliding = this.isSliding;
    this.player.isJumping = !this.isGrounded;
    this.player.jumpHeight = this.playerY;

    // Invulnerability cooldown
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= delta;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    this.player.update(
      delta,
      this.currentSpeed,
      this.lateralVelocity,
      this.isInvulnerable,
      this.glitchPhase === 'ACTIVE'
    );

    // 5. Update World Actors (Obstacles & Tunnel)
    const isGlitchActive = this.glitchPhase === 'ACTIVE';
    this.obstacles.update(this.playerZ, this.currentSpeed, isGlitchActive, delta);
    this.tunnel.update(this.playerZ, this.currentSpeed, delta);

    // 6. Collision Detection
    this.checkCollisions();

    // 7. Dynamic Chase Camera
    this.updateCamera(delta);

    // 8. Update Light Tracking
    this.keyLight.position.set(this.playerX + 5, 12, this.playerZ + 8);
    this.keyLight.target.position.set(this.playerX, 0, this.playerZ - 10);
    this.keyLight.target.updateMatrixWorld();

    // 9. Emit HUD stats
    this.emitStats();
  }

  // --- Glitch State Machine ---

  private updateGlitchMachine(delta: number): void {
    this.glitchTimer -= delta;

    if (this.glitchPhase === 'NONE') {
      if (this.glitchTimer <= 0) {
        // Transition to WARNING phase (2.0s)
        this.glitchPhase = 'WARNING';
        this.glitchTimer = 2.0;

        // Pick next random glitch
        const glitches: GlitchType[] = ['PING', 'POLARITY', 'PACKET_LOSS', 'TEXTURE_404'];
        this.nextGlitchType = glitches[Math.floor(Math.random() * glitches.length)];
        soundManager.playWarningBeep();
      }
    } else if (this.glitchPhase === 'WARNING') {
      if (this.glitchTimer <= 0) {
        // Transition to ACTIVE GLITCH (5.5 - 6.5s)
        this.glitchPhase = 'ACTIVE';
        this.activeGlitch = this.nextGlitchType;
        this.glitchTimer = 5.5 + Math.random() * 1.0;
        soundManager.playGlitchTrigger();

        // If 404 texture glitch, switch tunnel material
        if (this.activeGlitch === 'TEXTURE_404') {
          this.tunnel.setGlitchMode(true);
        }
      }
    } else if (this.glitchPhase === 'ACTIVE') {
      if (this.glitchTimer <= 0) {
        // Recovery: Controls return to normal
        if (this.activeGlitch === 'TEXTURE_404') {
          this.tunnel.setGlitchMode(false);
        }
        soundManager.playRestored();

        this.glitchPhase = 'NONE';
        this.activeGlitch = null;
        // 10-second cooldown before next glitch
        this.glitchTimer = 10.0;
      }
    }
  }

  // --- Collisions ---

  private checkCollisions(): void {
    const playerBox = this.player.boundingBox;

    for (const obs of this.obstacles.obstacles) {
      if (obs.passed) continue;

      // Check if player has passed this obstacle in Z
      if (obs.z > this.playerZ + 2.0) {
        obs.passed = true;
        continue;
      }

      // Check intersection
      if (playerBox.intersectsBox(obs.collider)) {
        if (obs.type === 'DATA_CRYSTAL') {
          // Bonus collectible item
          obs.passed = true;
          this.obstacles.container.remove(obs.group);
          this.packetsCollected++;
          soundManager.playCollect();
        } else {
          // Dangerous Barrier Hit!
          obs.passed = true;

          if (!this.isInvulnerable) {
            this.lives = Math.max(0, this.lives - 1);
            this.isInvulnerable = true;
            this.invulnerabilityTimer = 1.6; // 1.6s grace period
            this.cameraShakeIntensity = 0.65;
            soundManager.playCrash();

            if (this.lives <= 0) {
              this.triggerGameOver();
              return;
            }
          }
        }
      }
    }
  }

  // --- Camera Chase & Shake ---

  private updateCamera(delta: number): void {
    // Desired camera position behind and above player
    const targetCamX = this.playerX * 0.45;
    const targetCamY = 2.9 + (this.playerY * 0.3);
    const targetCamZ = this.playerZ + 5.2;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 10, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 12, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 25, delta);

    // Look-ahead target
    const lookTarget = new THREE.Vector3(
      this.playerX * 0.25,
      1.1 + (this.playerY * 0.3),
      this.playerZ - 12.0
    );
    this.camera.lookAt(lookTarget);

    // Camera shake on impact or packet loss
    if (this.cameraShakeIntensity > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = THREE.MathUtils.damp(this.cameraShakeIntensity, 0, 8, delta);
    }
  }

  // --- End States ---

  private triggerGameOver(): void {
    this.gameState = 'GAMEOVER';
    this.onStateChange?.('GAMEOVER');
    if (this.tunnel) this.tunnel.setGlitchMode(false);
  }

  private triggerVictory(): void {
    this.gameState = 'VICTORY';
    this.onStateChange?.('VICTORY');
    soundManager.playVictory();
    if (this.tunnel) this.tunnel.setGlitchMode(false);
  }

  // --- Stats Broadcasting ---

  private emitStats(): void {
    if (!this.onStatsUpdate) return;

    // Simulated ping display based on glitch state
    let ping = 28 + Math.floor(Math.sin(Date.now() * 0.005) * 6);
    if (this.glitchPhase === 'WARNING') {
      ping = 180 + Math.floor(Math.random() * 80);
    } else if (this.glitchPhase === 'ACTIVE') {
      if (this.activeGlitch === 'PING') ping = 999;
      else if (this.activeGlitch === 'PACKET_LOSS') ping = 480 + Math.floor(Math.random() * 250);
      else ping = 320 + Math.floor(Math.random() * 120);
    }

    this.onStatsUpdate({
      lives: this.lives,
      maxLives: this.maxLives,
      score: this.score,
      packetsCollected: this.packetsCollected,
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      distance: Math.floor(this.distance),
      speed: Math.round(this.currentSpeed * 3.6), // km/h representation
      currentPing: ping,
      glitchPhase: this.glitchPhase,
      activeGlitch: this.activeGlitch,
      glitchCountdown: Math.max(0, Number(this.glitchTimer.toFixed(1))),
      isInvulnerable: this.isInvulnerable,
      invulnerabilityTimer: this.invulnerabilityTimer,
    });
  }

  // --- Lifecycle & Cleanup ---

  private handleResize = (): void => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.player.dispose();
    this.obstacles.dispose();
    this.tunnel.dispose();
    this.renderer.dispose();
  }
}
