/**
 * INTERNET IS BROKEN — Complete 3D Endless Runner Game Engine
 * Handcrafted Indie Arcade Edition
 * 
 * Features:
 * - Dynamic 3D Mascot Character Menu Presentation with Interactive Idle Reactions
 * - Handcrafted Indie Arcade Menu & UI (Clean typography, tactile drop-shadows, zero neon/AI slop)
 * - Dynamic Obstacles & Moving Hazards across 4 Evolving Biomes
 * - Synchronized Distance-Based Reversed Instructions (Left->Right, Right->Left, Jump->Duck, Duck->Jump)
 * - Participant Registration, Local Leaderboard & Winner Announcements
 * 
 * Vanilla JavaScript + Three.js
 */

import * as THREE from 'three';

// --- GAME CONFIGURATION & CONSTANTS ---
const LANES = [-2.4, 0, 2.4]; // Left: -2.4, Center: 0, Right: 2.4
const LANE_NAMES = ['LEFT', 'CENTER', 'RIGHT'];
const BASE_SPEED = 24.0;      // Starting speed (units/s)
const MAX_SPEED = 52.0;       // Maximum terminal speed
const SPEED_ACCEL = 0.26;     // Speed ramp per second survived
const JUMP_VELOCITY = 11.5;   // Initial upward velocity
const GRAVITY = -32.0;        // Downward gravity
const DUCK_DURATION = 0.75;   // Seconds duck remains active
const INVULN_TIME = 1.6;      // Collision recovery invulnerability

// --- SOUND SYNTHESIZER (WEB AUDIO API) ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicLoopId = null;
    this.step = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMuted;
  }

  startMusic() {
    if (this.isMuted || !this.ctx) return;
    if (this.musicLoopId) return;

    // Upbeat indie arcade bassline
    const notes = [174.61, 220.00, 261.63, 293.66, 349.23, 293.66, 261.63, 220.00];
    const bass = [87.31, 87.31, 110.00, 110.00, 130.81, 130.81, 110.00, 98.00];

    this.musicLoopId = window.setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      const stepIdx = this.step % 8;

      this.playSynthNote(bass[stepIdx], 'triangle', t, 0.16, 0.18);

      if (stepIdx % 2 === 0) {
        this.playSynthNote(notes[stepIdx], 'sine', t, 0.1, 0.12);
      }

      this.step++;
    }, 140);
  }

  stopMusic() {
    if (this.musicLoopId) {
      clearInterval(this.musicLoopId);
      this.musicLoopId = null;
    }
  }

  playSynthNote(freq, type, startTime, duration, vol) {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch (_) {}
  }

  playCountdownBeep(isGo = false) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const freq = isGo ? 880 : 440;
      const duration = isGo ? 0.35 : 0.15;
      this.playSynthNote(freq, isGo ? 'square' : 'sine', now, duration, 0.35);
    } catch (_) {}
  }

  playJump() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (_) {}
  }

  playDuck() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (_) {}
  }

  playCrash() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch (_) {}
  }

  playCoin() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      this.playSynthNote(880, 'sine', now, 0.08, 0.3);
      this.playSynthNote(1320, 'sine', now + 0.07, 0.14, 0.35);
    } catch (_) {}
  }

  playInstructionQuip() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      this.playSynthNote(520, 'square', now, 0.06, 0.15);
      this.playSynthNote(780, 'square', now + 0.05, 0.08, 0.18);
    } catch (_) {}
  }

  playChampionChime() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, idx) => {
        this.playSynthNote(freq, 'triangle', now + idx * 0.08, 0.4, 0.28);
      });
    } catch (_) {}
  }
}

const sounds = new SoundController();

// --- PROCEDURAL 3D CARTOON CHARACTER: GIZZMO ---
class GizzmoCharacter {
  constructor() {
    this.group = new THREE.Group();
    this.boundingBox = new THREE.Box3();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      roughness: 0.5,
      metalness: 0.1,
    });

    const vestMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.7,
      metalness: 0.05,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.0,
    });

    const pupilMat = new THREE.MeshBasicMaterial({
      color: 0x181c20,
    });

    const sneakerMat = new THREE.MeshStandardMaterial({
      color: 0xc93b2b,
      roughness: 0.4,
    });

    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.5,
    });

    // 1. Torso & Belly
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.85, 0);

    const bellyGeom = new THREE.SphereGeometry(0.5, 16, 14);
    bellyGeom.scale(1.0, 1.2, 0.9);
    const belly = new THREE.Mesh(bellyGeom, bodyMat);
    belly.castShadow = true;
    this.torsoGroup.add(belly);

    const vestGeom = new THREE.CylinderGeometry(0.52, 0.54, 0.7, 16);
    const vest = new THREE.Mesh(vestGeom, vestMat);
    vest.position.set(0, 0, 0);
    this.torsoGroup.add(vest);

    // 2. Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.72, 0.08);

    const headGeom = new THREE.SphereGeometry(0.44, 16, 14);
    headGeom.scale(1.15, 0.95, 1.1);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Asymmetric Oversized Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), eyeMat);
    eyeL.position.set(-0.16, 0.12, 0.38);
    this.headGroup.add(eyeL);

    this.pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), pupilMat);
    this.pupilL.position.set(-0.16, 0.12, 0.52);
    this.headGroup.add(this.pupilL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), eyeMat);
    eyeR.position.set(0.18, 0.08, 0.4);
    this.headGroup.add(eyeR);

    this.pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), pupilMat);
    this.pupilR.position.set(0.18, 0.08, 0.5);
    this.headGroup.add(this.pupilR);

    // Buck Teeth & Snout
    const snoutGeom = new THREE.BoxGeometry(0.24, 0.12, 0.18);
    const snout = new THREE.Mesh(snoutGeom, vestMat);
    snout.position.set(0, -0.16, 0.4);
    this.headGroup.add(snout);

    const toothGeom = new THREE.BoxGeometry(0.07, 0.08, 0.02);
    const toothL = new THREE.Mesh(toothGeom, eyeMat);
    toothL.position.set(-0.05, -0.23, 0.48);
    const toothR = new THREE.Mesh(toothGeom, eyeMat);
    toothR.position.set(0.05, -0.23, 0.48);
    this.headGroup.add(toothL);
    this.headGroup.add(toothR);

    // Floppy Antennae / Ears
    this.earL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.32, 8), bodyMat);
    this.earL.position.set(-0.35, 0.42, 0);
    this.earL.rotation.z = 0.5;
    this.headGroup.add(this.earL);

    this.earR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.32, 8), bodyMat);
    this.earR.position.set(0.35, 0.42, 0);
    this.earR.rotation.z = -0.5;
    this.headGroup.add(this.earR);

    this.torsoGroup.add(this.headGroup);

    // 3. Cartoon Arms
    this.armL = this.createArm(-1, bodyMat, gloveMat);
    this.armL.position.set(-0.52, 0.25, 0);
    this.torsoGroup.add(this.armL);

    this.armR = this.createArm(1, bodyMat, gloveMat);
    this.armR.position.set(0.52, 0.25, 0);
    this.torsoGroup.add(this.armR);

    this.group.add(this.torsoGroup);

    // 4. Cartoon Legs
    this.legL = this.createLeg(-1, bodyMat, sneakerMat);
    this.legL.position.set(-0.24, 0.55, 0);
    this.group.add(this.legL);

    this.legR = this.createLeg(1, bodyMat, sneakerMat);
    this.legR.position.set(0.24, 0.55, 0);
    this.group.add(this.legR);

    this.runCycle = 0;
    this.idleTime = 0;
    this.blinkTimer = 2.0;
  }

  createArm(side, bodyMat, gloveMat) {
    const arm = new THREE.Group();
    const armGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.45, 8);
    armGeom.translate(0, -0.22, 0);
    const limb = new THREE.Mesh(armGeom, bodyMat);
    arm.add(limb);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), gloveMat);
    glove.position.set(0, -0.46, 0.05);
    arm.add(glove);

    return arm;
  }

  createLeg(side, bodyMat, sneakerMat) {
    const leg = new THREE.Group();
    const legGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.45, 8);
    legGeom.translate(0, -0.22, 0);
    const limb = new THREE.Mesh(legGeom, bodyMat);
    leg.add(limb);

    const shoeGeom = new THREE.BoxGeometry(0.22, 0.16, 0.36);
    shoeGeom.translate(0, -0.48, 0.06);
    const shoe = new THREE.Mesh(shoeGeom, sneakerMat);
    shoe.castShadow = true;
    leg.add(shoe);

    return leg;
  }

  /**
   * Handcrafted Mascot Idle Animation for Main Menu
   * Features curious eye darting, breathing bob, ear twitch, and responsive excitement on hover!
   */
  updateIdleMenu(delta, isHovered) {
    this.idleTime += delta;
    this.blinkTimer -= delta;

    // 1. Subtle natural breathing bob
    const breathe = Math.sin(this.idleTime * 1.8) * 0.035;
    this.torsoGroup.position.y = 0.85 + breathe + (isHovered ? 0.06 : 0);

    // 2. Ear spring reaction
    const earBounce = isHovered
      ? Math.sin(this.idleTime * 6.0) * 0.25
      : Math.cos(this.idleTime * 1.6) * 0.08;
    this.earL.rotation.z = 0.5 + earBounce;
    this.earR.rotation.z = -0.5 - earBounce;

    // 3. Curious head tilt & look towards viewer
    if (isHovered) {
      // Perks up attentive, looking up towards user
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, -0.15, 10, delta);
      this.headGroup.rotation.y = THREE.MathUtils.damp(this.headGroup.rotation.y, -0.25, 10, delta);
      this.headGroup.rotation.z = THREE.MathUtils.damp(this.headGroup.rotation.z, 0.08, 10, delta);
    } else {
      // Gentle lazy head wobble
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, 0.02, 6, delta);
      this.headGroup.rotation.y = THREE.MathUtils.damp(this.headGroup.rotation.y, Math.sin(this.idleTime * 0.6) * 0.18, 6, delta);
      this.headGroup.rotation.z = THREE.MathUtils.damp(this.headGroup.rotation.z, Math.sin(this.idleTime * 0.8) * 0.06, 6, delta);
    }

    // 4. Occasional Pupil Darting / Blinking
    if (this.blinkTimer <= 0) {
      this.blinkTimer = 2.5 + Math.random() * 2.0;
      const dartX = (Math.random() - 0.5) * 0.05;
      const dartY = (Math.random() - 0.5) * 0.04;
      this.pupilL.position.set(-0.16 + dartX, 0.12 + dartY, 0.52);
      this.pupilR.position.set(0.18 + dartX, 0.08 + dartY, 0.5);
    }

    // 5. Relaxed arms at sides
    this.armL.rotation.x = THREE.MathUtils.damp(this.armL.rotation.x, 0.15 + (isHovered ? -0.3 : 0), 8, delta);
    this.armR.rotation.x = THREE.MathUtils.damp(this.armR.rotation.x, 0.15 + (isHovered ? -0.3 : 0), 8, delta);
    this.legL.rotation.x = THREE.MathUtils.damp(this.legL.rotation.x, 0, 8, delta);
    this.legR.rotation.x = THREE.MathUtils.damp(this.legR.rotation.x, 0, 8, delta);

    this.group.visible = true;
  }

  update(delta, speed, isJumping, isDucking, isInvulnerable) {
    this.runCycle += delta * speed * 0.55;

    if (isInvulnerable) {
      const flash = Math.sin(Date.now() * 0.04) > 0;
      this.group.visible = flash;
    } else {
      this.group.visible = true;
    }

    this.earL.rotation.x = Math.sin(this.runCycle * 1.5) * 0.2;
    this.earR.rotation.x = Math.cos(this.runCycle * 1.5) * 0.2;

    if (isDucking) {
      this.torsoGroup.position.y = 0.35;
      this.torsoGroup.scale.set(1.4, 0.45, 1.3);
      this.legL.rotation.x = -1.2;
      this.legR.rotation.x = -1.2;
      this.armL.rotation.x = 1.0;
      this.armR.rotation.x = 1.0;
      this.headGroup.position.set(0, 0.4, 0.3);
    } else if (isJumping) {
      this.torsoGroup.position.y = 0.85;
      this.torsoGroup.scale.set(1, 1, 1);
      this.headGroup.position.set(0, 0.72, 0.08);
      this.legL.rotation.x = 0.7;
      this.legR.rotation.x = 0.4;
      this.armL.rotation.x = -1.2;
      this.armR.rotation.x = -1.2;
    } else {
      this.torsoGroup.position.y = 0.85 + Math.abs(Math.sin(this.runCycle * 2)) * 0.12;
      this.torsoGroup.scale.set(1, 1, 1);
      this.headGroup.position.set(0, 0.72, 0.08);
      this.headGroup.rotation.y = Math.sin(this.runCycle) * 0.15;

      const swing = Math.sin(this.runCycle) * 0.85;
      this.legL.rotation.x = swing;
      this.legR.rotation.x = -swing;
      this.armL.rotation.x = -swing * 0.9;
      this.armR.rotation.x = swing * 0.9;
    }

    this.updateCollider(isDucking);
  }

  updateCollider(isDucking) {
    const pos = this.group.position;
    if (isDucking) {
      this.boundingBox.min.set(pos.x - 0.4, pos.y, pos.z - 0.5);
      this.boundingBox.max.set(pos.x + 0.4, pos.y + 0.65, pos.z + 0.5);
    } else {
      this.boundingBox.min.set(pos.x - 0.45, pos.y, pos.z - 0.45);
      this.boundingBox.max.set(pos.x + 0.45, pos.y + 1.85, pos.z + 0.45);
    }
  }
}

// --- PROGRESSIVE 3D BIOME ENVIRONMENT SYSTEM ---
class TrackEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.trackSegments = [];
    this.trackWidth = 8.6;
    this.segmentLength = 40;
    this.totalSegments = 8;

    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x272e38,
      roughness: 0.85,
    });

    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.7,
    });

    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x3f6212,
      roughness: 0.95,
    });

    this.stripeMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
    });

    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8,
    });

    this.foliageMat = new THREE.MeshStandardMaterial({
      color: 0x22543d,
      roughness: 0.9,
    });

    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.6,
    });

    this.neonPylonMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
    });

    this.initTrack();
  }

  initTrack() {
    for (let i = 0; i < this.totalSegments; i++) {
      const z = -i * this.segmentLength;
      const segment = this.createSegment(z);
      this.scene.add(segment);
      this.trackSegments.push(segment);
    }
  }

  createSegment(z) {
    const group = new THREE.Group();
    group.position.set(0, 0, z);

    const roadGeom = new THREE.PlaneGeometry(this.trackWidth, this.segmentLength);
    roadGeom.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeom, this.roadMat);
    road.receiveShadow = true;
    group.add(road);

    const stripeCount = 6;
    const stripeLen = 3.5;
    for (let s = 0; s < stripeCount; s++) {
      const stripeZ = -this.segmentLength / 2 + (s * (this.segmentLength / stripeCount)) + 1.5;
      
      const stripeL = new THREE.Mesh(new THREE.PlaneGeometry(0.18, stripeLen), this.stripeMat);
      stripeL.rotateX(-Math.PI / 2);
      stripeL.position.set(-1.2, 0.01, stripeZ);
      group.add(stripeL);

      const stripeR = new THREE.Mesh(new THREE.PlaneGeometry(0.18, stripeLen), this.stripeMat);
      stripeR.rotateX(-Math.PI / 2);
      stripeR.position.set(1.2, 0.01, stripeZ);
      group.add(stripeR);
    }

    const curbGeom = new THREE.BoxGeometry(0.4, 0.25, this.segmentLength);
    const curbL = new THREE.Mesh(curbGeom, this.curbMat);
    curbL.position.set(-this.trackWidth / 2 - 0.2, 0.1, 0);
    group.add(curbL);

    const curbR = new THREE.Mesh(curbGeom, this.curbMat);
    curbR.position.set(this.trackWidth / 2 + 0.2, 0.1, 0);
    group.add(curbR);

    const grassGeom = new THREE.PlaneGeometry(24, this.segmentLength);
    grassGeom.rotateX(-Math.PI / 2);
    const grassL = new THREE.Mesh(grassGeom, this.grassMat);
    grassL.position.set(-this.trackWidth / 2 - 12.4, -0.02, 0);
    group.add(grassL);

    const grassR = new THREE.Mesh(grassGeom, this.grassMat);
    grassR.position.set(this.trackWidth / 2 + 12.4, -0.02, 0);
    group.add(grassR);

    this.addSceneryForZ(group, z);

    return group;
  }

  addSceneryForZ(group, z) {
    const absZ = Math.abs(z);

    if (absZ < 350) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.5, 8), this.woodMat);
      pole.position.set(-this.trackWidth / 2 - 2.5, 2.75, -10);
      pole.castShadow = true;
      group.add(pole);

      const treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.8, 6), this.woodMat);
      treeTrunk.position.set(this.trackWidth / 2 + 3.5, 0.9, -16);
      group.add(treeTrunk);

      const treeFoliage = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.5, 6), this.foliageMat);
      treeFoliage.position.set(this.trackWidth / 2 + 3.5, 2.6, -16);
      treeFoliage.castShadow = true;
      group.add(treeFoliage);

    } else if (absZ < 750) {
      const scaffold = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.0, 1.2), this.woodMat);
      scaffold.position.set(-this.trackWidth / 2 - 2.2, 3.0, -12);
      scaffold.castShadow = true;
      group.add(scaffold);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 10), this.curbMat);
      barrel.position.set(this.trackWidth / 2 + 2.0, 0.55, -15);
      group.add(barrel);

    } else if (absZ < 1200) {
      const archL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 0.6), this.concreteMat);
      archL.position.set(-this.trackWidth / 2 - 0.3, 2.75, -18);
      group.add(archL);

      const archR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 0.6), this.concreteMat);
      archR.position.set(this.trackWidth / 2 + 0.3, 2.75, -18);
      group.add(archR);

      const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(this.trackWidth + 1.2, 0.6, 0.6), this.concreteMat);
      crossbeam.position.set(0, 5.2, -18);
      group.add(crossbeam);

    } else {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.0, 0.4), this.neonPylonMat);
      pylon.position.set(-this.trackWidth / 2 - 2.5, 3.5, -10);
      group.add(pylon);

      const pylonR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.0, 0.4), this.neonPylonMat);
      pylonR.position.set(this.trackWidth / 2 + 2.5, 3.5, -22);
      group.add(pylonR);
    }
  }

  update(playerZ, distance) {
    const totalLength = this.totalSegments * this.segmentLength;
    this.trackSegments.forEach((segment) => {
      if (segment.position.z > playerZ + this.segmentLength) {
        segment.position.z -= totalLength;
      }
    });

    this.updateBiomeAtmosphere(distance);
  }

  updateBiomeAtmosphere(distance) {
    if (distance < 350) {
      this.scene.background.setHex(0x87ceeb);
      this.scene.fog.color.setHex(0x87ceeb);
    } else if (distance < 750) {
      this.scene.background.setHex(0xa0968c);
      this.scene.fog.color.setHex(0xa0968c);
    } else if (distance < 1200) {
      this.scene.background.setHex(0x1e293b);
      this.scene.fog.color.setHex(0x1e293b);
    } else {
      this.scene.background.setHex(0x2e1065);
      this.scene.fog.color.setHex(0x2e1065);
    }
  }

  reset() {
    for (let i = 0; i < this.totalSegments; i++) {
      this.trackSegments[i].position.set(0, 0, -i * this.segmentLength);
    }
    this.scene.background.setHex(0x87ceeb);
    this.scene.fog.color.setHex(0x87ceeb);
  }
}

// --- DYNAMIC HAZARD & PATTERN GENERATOR ---
class DynamicHazardController {
  constructor(scene) {
    this.scene = scene;
    this.container = new THREE.Group();
    this.scene.add(this.container);

    this.hazardEvents = [];
    this.coins = [];
    this.lastSpawnZ = -35;
    this.nextEventId = 1;

    this.crateMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.75,
    });

    this.barricadeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
    });

    this.hazardOrangeMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
    });

    this.pipeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.25,
    });

    this.robotSweeperMat = new THREE.MeshStandardMaterial({
      color: 0xc93b2b,
      metalness: 0.8,
      roughness: 0.2,
    });

    this.voidGlitchMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
    });

    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.2,
      metalness: 0.6,
    });
  }

  update(playerZ, speed, distance, level, delta) {
    const spawnHorizon = 150;
    const spacing = Math.max(42, speed * 2.4);

    while (this.lastSpawnZ > playerZ - spawnHorizon) {
      this.lastSpawnZ -= spacing + (Math.random() * 4);
      this.createDynamicPattern(this.lastSpawnZ, speed, distance, level);
    }

    for (const evt of this.hazardEvents) {
      if (evt.update) {
        evt.update(delta);
      }
    }

    for (const coin of this.coins) {
      if (!coin.collected) {
        coin.mesh.rotation.y += delta * 4.0;
      }
    }

    const cullZ = playerZ + 25;
    for (let i = this.hazardEvents.length - 1; i >= 0; i--) {
      const evt = this.hazardEvents[i];
      if (evt.z > cullZ) {
        this.container.remove(evt.group);
        this.disposeGroup(evt.group);
        this.hazardEvents.splice(i, 1);
      }
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (c.z > cullZ) {
        this.container.remove(c.mesh);
        c.mesh.geometry.dispose();
        this.coins.splice(i, 1);
      }
    }
  }

  createDynamicPattern(z, currentSpeed, distance, level) {
    const eventId = this.nextEventId++;
    const rand = Math.random();

    let type;
    let requiredAction;
    let displayedInstruction;
    let requiredKeypress;
    let safeLane = -1;
    let group = new THREE.Group();
    group.position.set(0, 0, z);
    let colliders = [];
    let updateFn = null;

    if (level === 1) {
      if (rand < 0.5) {
        type = 'LANE_BLOCK';
        const openLeft = Math.random() < 0.5;
        safeLane = openLeft ? 0 : 2;
        requiredAction = openLeft ? 'MOVE_LEFT' : 'MOVE_RIGHT';
        displayedInstruction = openLeft ? 'MOVE LEFT!' : 'MOVE RIGHT!';
        requiredKeypress = openLeft ? 'PRESS RIGHT [ → / D ]' : 'PRESS LEFT [ ← / A ]';

        if (openLeft) {
          colliders.push(this.buildCrateBlocker(group, 1));
          colliders.push(this.buildCrateBlocker(group, 2));
        } else {
          colliders.push(this.buildCrateBlocker(group, 0));
          colliders.push(this.buildCrateBlocker(group, 1));
        }
      } else {
        type = 'LOW_HURDLE';
        requiredAction = 'JUMP';
        displayedInstruction = 'JUMP!';
        requiredKeypress = 'PRESS DUCK [ ↓ / S ]';
        colliders.push(this.buildLowHurdle(group));
      }

    } else if (level <= 3) {
      if (rand < 0.35) {
        type = 'OVERHEAD_BAR';
        requiredAction = 'DUCK';
        displayedInstruction = 'DUCK / SLIDE!';
        requiredKeypress = 'PRESS JUMP [ ↑ / W / SPACE ]';
        colliders.push(this.buildOverheadBar(group));

      } else if (rand < 0.65) {
        type = 'ROAD_GAP';
        requiredAction = 'JUMP';
        displayedInstruction = 'JUMP!';
        requiredKeypress = 'PRESS DUCK [ ↓ / S ]';
        colliders.push(this.buildRoadTrench(group));

      } else {
        type = 'LANE_BLOCK';
        const openLeft = Math.random() < 0.5;
        safeLane = openLeft ? 0 : 2;
        requiredAction = openLeft ? 'MOVE_LEFT' : 'MOVE_RIGHT';
        displayedInstruction = openLeft ? 'MOVE LEFT!' : 'MOVE RIGHT!';
        requiredKeypress = openLeft ? 'PRESS RIGHT [ → / D ]' : 'PRESS LEFT [ ← / A ]';

        if (openLeft) {
          colliders.push(this.buildCrateBlocker(group, 1));
          colliders.push(this.buildCrateBlocker(group, 2));
        } else {
          colliders.push(this.buildCrateBlocker(group, 0));
          colliders.push(this.buildCrateBlocker(group, 1));
        }
      }

    } else {
      if (rand < 0.35) {
        type = 'MOVING_SWEEPER';
        const openLeft = Math.random() < 0.5;
        safeLane = openLeft ? 0 : 2;
        requiredAction = openLeft ? 'MOVE_LEFT' : 'MOVE_RIGHT';
        displayedInstruction = openLeft ? 'MOVE LEFT!' : 'MOVE RIGHT!';
        requiredKeypress = openLeft ? 'PRESS RIGHT [ → / D ]' : 'PRESS LEFT [ ← / A ]';

        const sweeperData = this.buildMovingSweeper(group, openLeft);
        colliders.push(sweeperData.collider);
        updateFn = sweeperData.update;

      } else if (rand < 0.65) {
        type = 'SWINGING_HAZARD';
        requiredAction = 'DUCK';
        displayedInstruction = 'DUCK / SLIDE!';
        requiredKeypress = 'PRESS JUMP [ ↑ / W / SPACE ]';

        const craneData = this.buildSwingingCrane(group);
        colliders.push(craneData.collider);
        updateFn = craneData.update;

      } else {
        type = 'GLITCH_VOID';
        requiredAction = 'JUMP';
        displayedInstruction = 'JUMP!';
        requiredKeypress = 'PRESS DUCK [ ↓ / S ]';
        colliders.push(this.buildGlitchVoid(group));
      }
    }

    this.container.add(group);

    const warningDistance = Math.max(40, currentSpeed * 2.3);

    const hazardEvent = {
      eventId,
      type,
      z,
      group,
      colliders,
      safeLane,
      requiredAction,
      displayedInstruction,
      requiredKeypress,
      warningDistance,
      instructionTriggered: false,
      cleared: false,
      result: null,
      spawnTime: performance.now(),
      instructionTime: null,
      update: updateFn,
    };

    this.hazardEvents.push(hazardEvent);

    if (Math.random() < 0.6) {
      const coinLane = safeLane >= 0 ? safeLane : Math.floor(Math.random() * 3);
      this.spawnCoin(coinLane, z - 8);
    }

    return hazardEvent;
  }

  buildCrateBlocker(parentGroup, laneIdx) {
    const x = LANES[laneIdx];
    const boxGeom = new THREE.BoxGeometry(1.65, 1.65, 1.4);
    const box = new THREE.Mesh(boxGeom, this.crateMat);
    box.position.set(x, 0.82, 0);
    box.castShadow = true;
    parentGroup.add(box);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.25, 1.44), this.hazardOrangeMat);
    stripe.position.set(x, 0.82, 0);
    parentGroup.add(stripe);

    return {
      type: 'BLOCKER',
      lane: laneIdx,
      minX: x - 0.9,
      maxX: x + 0.9,
      minY: 0,
      maxY: 3.5,
      depth: 0.8,
    };
  }

  buildLowHurdle(parentGroup) {
    const width = 7.6;
    const height = 0.82;

    const barGeom = new THREE.BoxGeometry(width, height, 0.45);
    const bar = new THREE.Mesh(barGeom, this.barricadeMat);
    bar.position.set(0, height / 2, 0);
    bar.castShadow = true;
    parentGroup.add(bar);

    const topStripe = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, 0.48), this.hazardOrangeMat);
    topStripe.position.set(0, height, 0);
    parentGroup.add(topStripe);

    return {
      type: 'LOW_HURDLE',
      lane: -1,
      minX: -width / 2,
      maxX: width / 2,
      minY: 0,
      maxY: height,
      depth: 0.45,
    };
  }

  buildOverheadBar(parentGroup) {
    const width = 8.0;
    const clearance = 0.85;

    const postGeom = new THREE.CylinderGeometry(0.18, 0.18, 3.6, 8);
    const postL = new THREE.Mesh(postGeom, this.pipeMat);
    postL.position.set(-width / 2 + 0.2, 1.8, 0);
    parentGroup.add(postL);

    const postR = postL.clone();
    postR.position.x = width / 2 - 0.2;
    parentGroup.add(postR);

    const beamGeom = new THREE.BoxGeometry(width, 1.2, 0.5);
    const beam = new THREE.Mesh(beamGeom, this.pipeMat);
    beam.position.set(0, clearance + 0.6, 0);
    beam.castShadow = true;
    parentGroup.add(beam);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.45, 0.08), this.hazardOrangeMat);
    sign.position.set(0, clearance + 0.6, 0.28);
    parentGroup.add(sign);

    return {
      type: 'OVERHEAD_BAR',
      lane: -1,
      minX: -width / 2,
      maxX: width / 2,
      minY: clearance,
      maxY: 3.2,
      depth: 0.5,
    };
  }

  buildRoadTrench(parentGroup) {
    const width = 7.6;
    const trenchGeom = new THREE.BoxGeometry(width, 0.6, 2.2);
    const trench = new THREE.Mesh(trenchGeom, this.pipeMat);
    trench.position.set(0, 0.25, 0);
    parentGroup.add(trench);

    const barL = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, 0.2), this.hazardOrangeMat);
    barL.position.set(0, 0.55, -1.0);
    parentGroup.add(barL);

    const barR = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, 0.2), this.hazardOrangeMat);
    barR.position.set(0, 0.55, 1.0);
    parentGroup.add(barR);

    return {
      type: 'LOW_HURDLE',
      lane: -1,
      minX: -width / 2,
      maxX: width / 2,
      minY: 0,
      maxY: 0.75,
      depth: 1.2,
    };
  }

  buildMovingSweeper(parentGroup, openLeft) {
    const sweeperGroup = new THREE.Group();
    parentGroup.add(sweeperGroup);

    const sweeperMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 1.2), this.robotSweeperMat);
    sweeperMesh.position.y = 0.9;
    sweeperMesh.castShadow = true;
    sweeperGroup.add(sweeperMesh);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), this.hazardOrangeMat);
    beacon.position.set(0, 1.95, 0);
    sweeperGroup.add(beacon);

    const centerLaneX = LANES[1];
    const blockedLaneX = openLeft ? LANES[2] : LANES[0];
    const midX = (centerLaneX + blockedLaneX) / 2;
    const sweepAmp = Math.abs(blockedLaneX - centerLaneX) / 2;

    const collider = {
      type: 'BLOCKER',
      lane: -1,
      minX: midX - 1.0,
      maxX: midX + 1.0,
      minY: 0,
      maxY: 3.5,
      depth: 0.8,
    };

    let sweepTime = 0;
    const update = (delta) => {
      sweepTime += delta * 3.2;
      const currentX = midX + Math.sin(sweepTime) * sweepAmp;
      sweeperGroup.position.x = currentX;
      collider.minX = currentX - 1.0;
      collider.maxX = currentX + 1.0;
    };

    return { collider, update };
  }

  buildSwingingCrane(parentGroup) {
    const cranePivot = new THREE.Group();
    cranePivot.position.set(0, 4.8, 0);
    parentGroup.add(cranePivot);

    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8), this.pipeMat);
    cable.position.set(0, -1.6, 0);
    cranePivot.add(cable);

    const weight = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 0.7), this.barricadeMat);
    weight.position.set(0, -3.2, 0);
    weight.castShadow = true;
    cranePivot.add(weight);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 0.75), this.hazardOrangeMat);
    stripe.position.set(0, -3.2, 0);
    cranePivot.add(stripe);

    const collider = {
      type: 'OVERHEAD_BAR',
      lane: -1,
      minX: -2.8,
      maxX: 2.8,
      minY: 0.85,
      maxY: 2.8,
      depth: 0.5,
    };

    let pendulumTime = 0;
    const update = (delta) => {
      pendulumTime += delta * 2.5;
      cranePivot.rotation.z = Math.sin(pendulumTime) * 0.45;
    };

    return { collider, update };
  }

  buildGlitchVoid(parentGroup) {
    const width = 7.6;
    const voidMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, 2.5), this.voidGlitchMat);
    voidMesh.rotateX(-Math.PI / 2);
    voidMesh.position.set(0, 0.05, 0);
    parentGroup.add(voidMesh);

    const barL = new THREE.Mesh(new THREE.BoxGeometry(width, 0.25, 0.2), this.hazardOrangeMat);
    barL.position.set(0, 0.12, -1.2);
    parentGroup.add(barL);

    const barR = new THREE.Mesh(new THREE.BoxGeometry(width, 0.25, 0.2), this.hazardOrangeMat);
    barR.position.set(0, 0.12, 1.2);
    parentGroup.add(barR);

    return {
      type: 'LOW_HURDLE',
      lane: -1,
      minX: -width / 2,
      maxX: width / 2,
      minY: 0,
      maxY: 0.8,
      depth: 1.3,
    };
  }

  spawnCoin(laneIdx, z) {
    const x = LANES[laneIdx];
    const coinGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 14);
    coinGeom.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(coinGeom, this.coinMat);
    mesh.position.set(x, 0.9, z);
    this.container.add(mesh);

    this.coins.push({
      x,
      z,
      mesh,
      collected: false,
    });
  }

  reset() {
    for (const evt of this.hazardEvents) {
      this.container.remove(evt.group);
      this.disposeGroup(evt.group);
    }
    this.hazardEvents = [];

    for (const c of this.coins) {
      this.container.remove(c.mesh);
      c.mesh.geometry.dispose();
    }
    this.coins = [];

    this.lastSpawnZ = -35;
    this.nextEventId = 1;
  }

  disposeGroup(group) {
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
  }
}

// --- MAIN GAME APPLICATION CLASS ---
class InternetIsBrokenGame {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.container = document.getElementById('game-container');

    // UI Elements
    this.hud = document.getElementById('hud');
    this.mobileControls = document.getElementById('mobile-controls');
    this.startScreen = document.getElementById('start-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.howtoplayModal = document.getElementById('howtoplay-modal');
    this.hitFlash = document.getElementById('hit-flash');

    // Registration Elements
    this.playerNameInput = document.getElementById('player-name-input');
    this.nameError = document.getElementById('name-error');
    this.hudPlayerName = document.getElementById('hud-player-name');
    this.gameoverPlayerName = document.getElementById('gameover-player-name');

    // Countdown Elements
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownNumber = document.getElementById('countdown-number');
    this.countdownInterval = null;

    // HUD Text
    this.scoreVal = document.getElementById('score-val');
    this.distVal = document.getElementById('dist-val');
    this.levelVal = document.getElementById('level-val');
    this.sectorVal = document.getElementById('sector-val');
    this.speedVal = document.getElementById('speed-val');
    this.instructionCard = document.getElementById('instruction-card');
    this.instructionDisplay = document.getElementById('instruction-display');
    this.reverseHint = document.getElementById('reverse-hint');
    this.startHighScore = document.getElementById('start-high-score');

    // Winner Elements
    this.championBanner = document.getElementById('champion-banner');
    this.championTitle = document.getElementById('champion-title');
    this.championDesc = document.getElementById('champion-desc');
    this.championIcon = document.getElementById('champion-icon');
    this.gameoverPbBadge = document.getElementById('gameover-pb-badge');

    // Leaderboard Elements
    this.leaderboardTbody = document.getElementById('leaderboard-tbody');
    this.leaderboardEmpty = document.getElementById('leaderboard-empty');

    // Menu Interactive Mascot Reaction Flag
    this.isStartHovered = false;

    // Participant Identity
    this.currentPlayerName = localStorage.getItem('broken_internet_last_player') || '';
    if (this.playerNameInput && this.currentPlayerName) {
      this.playerNameInput.value = this.currentPlayerName;
    }

    this.leaderboardOrigin = 'START';

    // Game State
    this.gameState = 'START'; // 'START' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.score = 0;
    this.distance = 0;
    this.currentLevel = 1;
    this.currentSector = 'HIGHWAY';
    this.currentSpeed = BASE_SPEED;
    this.lives = 3;
    this.maxLives = 3;
    this.isInvulnerable = false;
    this.invulnTimer = 0;

    // Movement / Lane State
    this.currentLane = 1;
    this.playerX = LANES[1];
    this.playerY = 0;
    this.playerZ = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isDucking = false;
    this.duckTimer = 0;

    // Synchronized Hazard State
    this.activeHazard = null;
    this.currentInstructionText = 'READY!';
    this.currentHintText = 'WATCH GIZZMO!';

    // Persistent Leaderboard Cache
    this.leaderboardRecords = this.loadLeaderboardFromStorage();
    this.updateStartHighScoreDisplay();

    // Initialize Three.js Engine
    this.initThree();
    this.initEvents();

    // Start render loop
    this.clock = new THREE.Clock();
    this.tick();
  }

  // --- LEADERBOARD LOGIC & STORAGE ---
  loadLeaderboardFromStorage() {
    try {
      const raw = localStorage.getItem('broken_internet_leaderboard');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return this.sortLeaderboard(parsed);
        }
      }
    } catch (_) {}
    return [];
  }

  saveLeaderboardToStorage() {
    try {
      localStorage.setItem('broken_internet_leaderboard', JSON.stringify(this.leaderboardRecords));
    } catch (_) {}
  }

  sortLeaderboard(records) {
    return records.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.distance !== a.distance) return b.distance - a.distance;
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
  }

  updateStartHighScoreDisplay() {
    if (this.startHighScore) {
      const best = this.leaderboardRecords.length > 0 ? this.leaderboardRecords[0].score : 0;
      this.startHighScore.textContent = best.toLocaleString();
    }
  }

  recordCompletedRun(name, score, distance, level) {
    const trimmedName = name.trim();
    const normalized = trimmedName.toLowerCase();

    let isNewPersonalBest = false;
    let existingEntry = this.leaderboardRecords.find((r) => r.normalizedName === normalized);

    if (existingEntry) {
      if (score > existingEntry.score || (score === existingEntry.score && distance > existingEntry.distance)) {
        existingEntry.score = score;
        existingEntry.distance = distance;
        existingEntry.level = Math.max(existingEntry.level, level);
        existingEntry.name = trimmedName;
        existingEntry.timestamp = Date.now();
        isNewPersonalBest = true;
      }
    } else {
      existingEntry = {
        name: trimmedName,
        normalizedName: normalized,
        score,
        distance,
        level,
        timestamp: Date.now(),
      };
      this.leaderboardRecords.push(existingEntry);
      isNewPersonalBest = true;
    }

    this.leaderboardRecords = this.sortLeaderboard(this.leaderboardRecords);
    this.saveLeaderboardToStorage();
    this.updateStartHighScoreDisplay();

    const rankIndex = this.leaderboardRecords.findIndex((r) => r.normalizedName === normalized);
    const rank = rankIndex + 1;
    const isDeviceChampion = (rank === 1 && score === this.leaderboardRecords[0].score);

    return {
      rank,
      isDeviceChampion,
      isNewPersonalBest,
      champion: this.leaderboardRecords[0],
      totalRunners: this.leaderboardRecords.length,
    };
  }

  renderLeaderboardView() {
    if (!this.leaderboardTbody || !this.leaderboardEmpty) return;

    this.leaderboardTbody.innerHTML = '';
    const currentNormalized = (this.currentPlayerName || '').toLowerCase().trim();

    if (this.leaderboardRecords.length === 0) {
      this.leaderboardEmpty.style.display = 'block';
      return;
    }

    this.leaderboardEmpty.style.display = 'none';

    this.leaderboardRecords.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      const isCurrent = (entry.normalizedName === currentNormalized);
      if (isCurrent) tr.classList.add('current-player');

      let rankText = `#${idx + 1}`;
      let rankClass = 'rank-badge';
      if (idx === 0) { rankText = '🥇 1'; rankClass += ' rank-gold'; }
      else if (idx === 1) { rankText = '🥈 2'; rankClass += ' rank-silver'; }
      else if (idx === 2) { rankText = '🥉 3'; rankClass += ' rank-bronze'; }

      const tdRank = document.createElement('td');
      tdRank.className = rankClass;
      tdRank.textContent = rankText;
      tr.appendChild(tdRank);

      const tdName = document.createElement('td');
      tdName.textContent = entry.name;
      if (isCurrent) {
        const youTag = document.createElement('span');
        youTag.style.cssText = 'font-size: 9px; margin-left: 6px; padding: 1px 5px; border-radius: 4px; background: #e07a2c; color: #fff; font-family: monospace; font-weight: 800;';
        youTag.textContent = 'YOU';
        tdName.appendChild(youTag);
      }
      tr.appendChild(tdName);

      const tdScore = document.createElement('td');
      tdScore.style.textAlign = 'right';
      tdScore.style.fontFamily = 'Fredoka, cursive';
      tdScore.style.fontWeight = '700';
      tdScore.textContent = entry.score.toLocaleString();
      tr.appendChild(tdScore);

      const tdDist = document.createElement('td');
      tdDist.style.textAlign = 'right';
      tdDist.style.fontFamily = 'JetBrains Mono, monospace';
      tdDist.textContent = `${entry.distance}m`;
      tr.appendChild(tdDist);

      const tdLvl = document.createElement('td');
      tdLvl.style.textAlign = 'center';
      tdLvl.style.fontFamily = 'JetBrains Mono, monospace';
      tdLvl.style.color = '#b45309';
      tdLvl.textContent = `L${entry.level || 1}`;
      tr.appendChild(tdLvl);

      this.leaderboardTbody.appendChild(tr);
    });
  }

  openLeaderboard(originScreen) {
    this.leaderboardOrigin = originScreen;
    this.renderLeaderboardView();

    this.startScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.gameoverScreen.classList.remove('active');
    if (this.howtoplayModal) this.howtoplayModal.classList.remove('active');

    this.leaderboardModal.classList.add('active');
  }

  closeLeaderboard() {
    this.leaderboardModal.classList.remove('active');
    if (this.leaderboardOrigin === 'START') {
      this.startScreen.classList.add('active');
    } else if (this.leaderboardOrigin === 'PAUSE') {
      this.pauseScreen.classList.add('active');
    } else if (this.leaderboardOrigin === 'GAMEOVER') {
      this.gameoverScreen.classList.add('active');
    }
  }

  openHowToPlay() {
    this.howtoplayModal?.classList.add('active');
  }

  closeHowToPlay() {
    this.howtoplayModal?.classList.remove('active');
  }

  clearLeaderboardRecords() {
    const confirmed = window.confirm(
      'Are you sure you want to clear all leaderboard records on this device? This action cannot be undone.'
    );
    if (confirmed) {
      this.leaderboardRecords = [];
      try {
        localStorage.removeItem('broken_internet_leaderboard');
      } catch (_) {}
      this.renderLeaderboardView();
      this.updateStartHighScoreDisplay();
    }
  }

  // --- THREE.JS ENGINE SETUP ---
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 45, 140);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);
    // Menu Camera default position (framing Gizzmo handsomely in right viewport)
    this.camera.position.set(0.85, 1.45, 3.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x475569, 1.1);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.dirLight.position.set(10, 20, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 45;
    this.dirLight.shadow.camera.left = -9;
    this.dirLight.shadow.camera.right = 9;
    this.dirLight.shadow.camera.top = 9;
    this.dirLight.shadow.camera.bottom = -9;
    this.scene.add(this.dirLight);

    this.character = new GizzmoCharacter();
    this.scene.add(this.character.group);

    this.track = new TrackEnvironment(this.scene);
    this.obstacles = new DynamicHazardController(this.scene);
  }

  // --- REVERSED CONTROL SYSTEM LOGIC ---
  handlePlayerInput(rawAction) {
    if (this.gameState !== 'PLAYING') return;

    switch (rawAction) {
      case 'KEY_RIGHT':
        this.performMoveLeft();
        break;

      case 'KEY_LEFT':
        this.performMoveRight();
        break;

      case 'KEY_DOWN':
        this.performJump();
        break;

      case 'KEY_UP':
        this.performDuck();
        break;
    }
  }

  performMoveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
    }
  }

  performMoveRight() {
    if (this.currentLane < 2) {
      this.currentLane++;
    }
  }

  performJump() {
    if (this.isGrounded && !this.isDucking) {
      this.verticalVelocity = JUMP_VELOCITY;
      this.isGrounded = false;
      sounds.playJump();
    }
  }

  performDuck() {
    if (this.isGrounded && !this.isDucking) {
      this.isDucking = true;
      this.duckTimer = DUCK_DURATION;
      sounds.playDuck();
    }
  }

  // --- DISTANCE-SYNCHRONIZED INSTRUCTION ENGINE ---
  updateSynchronizedInstructions() {
    if (this.activeHazard) {
      if (this.playerZ <= this.activeHazard.z - 1.5) {
        this.activeHazard.cleared = true;
        this.activeHazard = null;
      }
    }

    if (!this.activeHazard) {
      for (const hazard of this.obstacles.hazardEvents) {
        if (!hazard.cleared && hazard.z < this.playerZ) {
          const distanceToHazard = this.playerZ - hazard.z;

          if (distanceToHazard <= hazard.warningDistance) {
            this.activeHazard = hazard;
            hazard.instructionTriggered = true;
            hazard.instructionTime = performance.now();

            this.setInstruction(
              hazard.displayedInstruction,
              hazard.requiredKeypress
            );
            break;
          }
        }
      }
    }
  }

  setInstruction(text, hint) {
    if (this.currentInstructionText === text && this.currentHintText === hint) return;

    this.currentInstructionText = text;
    this.currentHintText = hint;

    if (this.instructionDisplay) {
      this.instructionDisplay.textContent = text;
    }
    if (this.reverseHint) {
      this.reverseHint.textContent = hint;
    }

    if (this.instructionCard) {
      this.instructionCard.classList.remove('pop');
      void this.instructionCard.offsetWidth;
      this.instructionCard.classList.add('pop');
      setTimeout(() => this.instructionCard.classList.remove('pop'), 250);
    }

    sounds.playInstructionQuip();
  }

  // --- COLLISION DETECTION & THREE-LIFE SYSTEM ---
  checkCollisions() {
    for (const coin of this.obstacles.coins) {
      if (!coin.collected && Math.abs(coin.z - this.playerZ) < 1.2 && Math.abs(coin.x - this.playerX) < 1.0) {
        coin.collected = true;
        this.obstacles.container.remove(coin.mesh);
        this.score += 50;
        sounds.playCoin();
      }
    }

    const playerZ = this.playerZ;
    const playerX = this.playerX;
    const playerY = this.playerY;

    for (const hazard of this.obstacles.hazardEvents) {
      if (hazard.cleared) continue;

      const dz = Math.abs(hazard.z - playerZ);
      if (dz < 1.2) {
        let isHit = false;

        for (const col of hazard.colliders) {
          if (col.type === 'BLOCKER') {
            if (playerX >= col.minX && playerX <= col.maxX) {
              isHit = true;
              break;
            }
          } else if (col.type === 'LOW_HURDLE') {
            if (playerY < col.maxY - 0.1) {
              isHit = true;
              break;
            }
          } else if (col.type === 'OVERHEAD_BAR') {
            if (!this.isDucking || playerY > 0.4) {
              isHit = true;
              break;
            }
          }
        }

        if (isHit) {
          hazard.cleared = true;
          hazard.result = 'HIT';

          if (!this.isInvulnerable) {
            this.handleCollisionHit();
            return;
          }
        }
      }
    }
  }

  handleCollisionHit() {
    this.lives = Math.max(0, this.lives - 1);
    this.isInvulnerable = true;
    this.invulnTimer = INVULN_TIME;
    sounds.playCrash();

    if (this.hitFlash) {
      this.hitFlash.classList.add('active');
      setTimeout(() => this.hitFlash.classList.remove('active'), 180);
    }

    this.updateLivesHUD();

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  updateLivesHUD() {
    for (let i = 1; i <= this.maxLives; i++) {
      const pip = document.getElementById(`heart-${i}`);
      if (pip) {
        if (i <= this.lives) {
          pip.classList.remove('lost');
          pip.textContent = '❤️';
        } else {
          pip.classList.add('lost');
          pip.textContent = '🖤';
        }
      }
    }
  }

  // --- SIMULATION TICK & GAME LOOP ---
  tick = () => {
    requestAnimationFrame(this.tick);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.gameState === 'PLAYING') {
      this.updateSimulation(delta);
    } else if (this.gameState === 'START') {
      // Handcrafted Menu Idle Presentation
      this.character.updateIdleMenu(delta, this.isStartHovered);

      // Camera smoothly frames Gizzmo in menu
      const isMobile = window.innerWidth < 680;
      const targetCamX = isMobile ? 0 : 0.85;
      const targetCamY = isMobile ? 1.4 : 1.45;
      const targetCamZ = isMobile ? 3.3 : 3.2;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 6, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 6, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 6, delta);

      const lookTarget = new THREE.Vector3(isMobile ? 0 : -0.15, 0.95, 0);
      this.camera.lookAt(lookTarget);

    } else if (this.gameState === 'COUNTDOWN') {
      this.character.updateIdleMenu(delta, true);

      // Camera begins smooth sweep back to running chase angle
      const targetCamX = this.playerX * 0.42;
      const targetCamY = 3.3;
      const targetCamZ = this.playerZ + 5.8;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 5, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 5, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 5, delta);

      const lookTarget = new THREE.Vector3(this.playerX * 0.25, 1.1, this.playerZ - 10.0);
      this.camera.lookAt(lookTarget);
    }

    this.renderer.render(this.scene, this.camera);
  };

  updateSimulation(delta) {
    // 1. Progressive Difficulty & Biome calculation
    this.currentSpeed = Math.min(MAX_SPEED, this.currentSpeed + SPEED_ACCEL * delta);
    this.distance += this.currentSpeed * delta;
    this.score += Math.floor(this.currentSpeed * delta * 2.5);
    this.currentLevel = Math.floor(this.distance / 250) + 1;

    // Sector / Biome Update
    if (this.distance < 350) {
      this.currentSector = 'HIGHWAY';
    } else if (this.distance < 750) {
      this.currentSector = 'WORK ZONE';
    } else if (this.distance < 1200) {
      this.currentSector = 'TUNNEL';
    } else {
      this.currentSector = 'GLITCH WAY';
    }

    // 2. Lane Interpolation
    const targetX = LANES[this.currentLane];
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 16, delta);

    // 3. Jump Physics
    if (!this.isGrounded) {
      this.verticalVelocity += GRAVITY * delta;
      this.playerY += this.verticalVelocity * delta;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // 4. Ducking Timer
    if (this.isDucking) {
      this.duckTimer -= delta;
      if (this.duckTimer <= 0) {
        this.isDucking = false;
      }
    }

    // 5. Invulnerability Timer
    if (this.isInvulnerable) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // 6. Forward Run Position
    this.playerZ -= this.currentSpeed * delta;

    // 7. Update Character Mesh
    this.character.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.character.update(delta, this.currentSpeed, !this.isGrounded, this.isDucking, this.isInvulnerable);

    // 8. Update Environment & Dynamic Obstacles
    this.track.update(this.playerZ, this.distance);
    this.obstacles.update(this.playerZ, this.currentSpeed, this.distance, this.currentLevel, delta);

    // 9. Update Synchronized Instruction Engine
    this.updateSynchronizedInstructions();

    // 10. Check Collisions
    this.checkCollisions();

    // 11. Third-Person Chase Camera Follow (Subway Surfers perspective)
    const targetCamX = this.playerX * 0.42;
    const targetCamY = 3.3 + (this.playerY * 0.35);
    const targetCamZ = this.playerZ + 5.8;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 12, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 12, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 25, delta);

    const lookTarget = new THREE.Vector3(
      this.playerX * 0.25,
      1.1 + (this.playerY * 0.25),
      this.playerZ - 10.0
    );
    this.camera.lookAt(lookTarget);

    this.dirLight.position.set(this.playerX + 10, 20, this.playerZ + 10);
    this.dirLight.target.position.set(this.playerX, 0, this.playerZ - 10);
    this.dirLight.target.updateMatrixWorld();

    // 12. Update HUD values
    this.updateHUD();
  }

  updateHUD() {
    if (this.scoreVal) this.scoreVal.textContent = this.score.toLocaleString();
    if (this.distVal) this.distVal.textContent = Math.floor(this.distance);
    if (this.levelVal) this.levelVal.textContent = this.currentLevel;
    if (this.sectorVal) this.sectorVal.textContent = this.currentSector;
    if (this.speedVal) this.speedVal.textContent = Math.round(this.currentSpeed * 3.6);
  }

  // --- PARTICIPANT REGISTRATION & START FLOW ---
  handleRegistrationAndStart() {
    if (!this.playerNameInput) return;

    const rawName = this.playerNameInput.value || '';
    const trimmed = rawName.trim();

    if (!trimmed || trimmed.length === 0 || trimmed.length > 20) {
      if (this.nameError) {
        this.nameError.classList.add('active');
        this.playerNameInput.focus();
      }
      return;
    }

    if (this.nameError) {
      this.nameError.classList.remove('active');
    }

    this.currentPlayerName = trimmed;
    try {
      localStorage.setItem('broken_internet_last_player', trimmed);
    } catch (_) {}

    if (this.hudPlayerName) {
      this.hudPlayerName.textContent = this.currentPlayerName;
    }

    this.startScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.gameoverScreen.classList.remove('active');
    this.leaderboardModal.classList.remove('active');
    if (this.howtoplayModal) this.howtoplayModal.classList.remove('active');

    this.startCountdownSequence();
  }

  startCountdownSequence() {
    this.gameState = 'COUNTDOWN';
    sounds.init();

    if (this.countdownOverlay && this.countdownNumber) {
      this.countdownOverlay.classList.add('active');
      let count = 3;
      this.countdownNumber.textContent = String(count);
      sounds.playCountdownBeep(false);

      if (this.countdownInterval) clearInterval(this.countdownInterval);

      this.countdownInterval = window.setInterval(() => {
        count--;
        if (count > 0) {
          this.countdownNumber.textContent = String(count);
          sounds.playCountdownBeep(false);
        } else if (count === 0) {
          this.countdownNumber.textContent = 'GO!';
          sounds.playCountdownBeep(true);
        } else {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
          this.countdownOverlay.classList.remove('active');
          this.beginRun();
        }
      }, 750);
    } else {
      this.beginRun();
    }
  }

  beginRun() {
    this.resetRun();
    this.gameState = 'PLAYING';
    sounds.startMusic();

    this.hud.style.display = 'flex';
    this.mobileControls.style.display = 'flex';
  }

  pauseGame() {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'PAUSED';
    this.pauseScreen.classList.add('active');
  }

  resumeGame() {
    if (this.gameState !== 'PAUSED') return;
    this.gameState = 'PLAYING';
    this.pauseScreen.classList.remove('active');
    this.clock.start();
  }

  // --- GAME OVER & WINNER ANNOUNCEMENT ---
  triggerGameOver() {
    this.gameState = 'GAMEOVER';
    sounds.stopMusic();

    const finalScore = this.score;
    const finalDist = Math.floor(this.distance);
    const finalLevel = this.currentLevel;

    const result = this.recordCompletedRun(
      this.currentPlayerName,
      finalScore,
      finalDist,
      finalLevel
    );

    if (this.gameoverPlayerName) {
      this.gameoverPlayerName.textContent = this.currentPlayerName;
    }
    document.getElementById('gameover-score').textContent = finalScore.toLocaleString();
    document.getElementById('gameover-dist').textContent = finalDist.toLocaleString();
    document.getElementById('gameover-level').textContent = finalLevel;

    if (this.gameoverPbBadge) {
      this.gameoverPbBadge.style.display = result.isNewPersonalBest ? 'block' : 'none';
    }

    if (this.championBanner && this.championTitle && this.championDesc && this.championIcon) {
      if (result.isDeviceChampion) {
        this.championIcon.textContent = '👑';
        this.championTitle.textContent = 'NEW LEADERBOARD CHAMPION!';
        this.championDesc.textContent = `You hold the #1 highest score on this device with ${finalScore.toLocaleString()} pts!`;
        sounds.playChampionChime();
      } else {
        this.championIcon.textContent = '🏅';
        this.championTitle.textContent = `DEVICE RANK: #${result.rank} OF ${result.totalRunners}`;
        const leaderName = result.champion ? result.champion.name : 'Unknown';
        const leaderScore = result.champion ? result.champion.score.toLocaleString() : '0';
        this.championDesc.textContent = `Current device leader: ${leaderName} (${leaderScore} pts). Keep practicing!`;
      }
    }

    this.gameoverScreen.classList.add('active');
  }

  showHome() {
    this.gameState = 'START';
    sounds.stopMusic();

    this.pauseScreen.classList.remove('active');
    this.gameoverScreen.classList.remove('active');
    this.leaderboardModal.classList.remove('active');
    if (this.howtoplayModal) this.howtoplayModal.classList.remove('active');
    this.startScreen.classList.add('active');

    this.hud.style.display = 'none';
    this.mobileControls.style.display = 'none';

    if (this.playerNameInput) {
      this.playerNameInput.value = this.currentPlayerName;
    }

    this.resetRun();
  }

  resetRun() {
    this.score = 0;
    this.distance = 0;
    this.currentLevel = 1;
    this.currentSector = 'HIGHWAY';
    this.currentSpeed = BASE_SPEED;
    this.lives = this.maxLives;
    this.isInvulnerable = false;
    this.invulnTimer = 0;

    this.currentLane = 1;
    this.playerX = LANES[1];
    this.playerY = 0;
    this.playerZ = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isDucking = false;

    this.activeHazard = null;
    this.currentInstructionText = '';
    this.currentHintText = '';

    this.character.group.position.set(0, 0, 0);
    this.obstacles.reset();
    this.track.reset();

    this.updateLivesHUD();
    this.updateHUD();

    if (this.instructionDisplay) this.instructionDisplay.textContent = 'READY!';
    if (this.reverseHint) this.reverseHint.textContent = 'WATCH GIZZMO!';
  }

  // --- EVENT LISTENERS ---
  initEvents() {
    window.addEventListener('keydown', (e) => {
      if (document.activeElement === this.playerNameInput) {
        if (e.key === 'Enter') {
          this.handleRegistrationAndStart();
        }
        return;
      }

      if (e.repeat) return;

      const k = e.key.toLowerCase();

      if (k === 'escape' || k === 'p') {
        if (this.gameState === 'PLAYING') this.pauseGame();
        else if (this.gameState === 'PAUSED') this.resumeGame();
        return;
      }

      if (k === 'enter') {
        if (this.gameState === 'START') {
          this.handleRegistrationAndStart();
          return;
        } else if (this.gameState === 'GAMEOVER') {
          this.startCountdownSequence();
          return;
        }
      }

      if (this.gameState !== 'PLAYING') return;

      if (k === 'arrowright' || k === 'd') {
        this.handlePlayerInput('KEY_RIGHT');
      } else if (k === 'arrowleft' || k === 'a') {
        this.handlePlayerInput('KEY_LEFT');
      } else if (k === 'arrowdown' || k === 's') {
        this.handlePlayerInput('KEY_DOWN');
      } else if (k === 'arrowup' || k === 'w' || k === ' ') {
        this.handlePlayerInput('KEY_UP');
      }
    });

    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');
    const btnJump = document.getElementById('touch-jump');
    const btnDuck = document.getElementById('touch-duck');

    if (btnLeft) {
      btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlePlayerInput('KEY_LEFT');
      });
      btnLeft.addEventListener('click', () => this.handlePlayerInput('KEY_LEFT'));
    }

    if (btnRight) {
      btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlePlayerInput('KEY_RIGHT');
      });
      btnRight.addEventListener('click', () => this.handlePlayerInput('KEY_RIGHT'));
    }

    if (btnJump) {
      btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlePlayerInput('KEY_UP');
      });
      btnJump.addEventListener('click', () => this.handlePlayerInput('KEY_UP'));
    }

    if (btnDuck) {
      btnDuck.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlePlayerInput('KEY_DOWN');
      });
      btnDuck.addEventListener('click', () => this.handlePlayerInput('KEY_DOWN'));
    }

    // Start Button with Mascot Reaction
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.addEventListener('mouseenter', () => { this.isStartHovered = true; });
      btnStart.addEventListener('mouseleave', () => { this.isStartHovered = false; });
      btnStart.addEventListener('click', () => {
        this.handleRegistrationAndStart();
      });
    }

    // Name Input Focus Mascot Reaction
    if (this.playerNameInput) {
      this.playerNameInput.addEventListener('focus', () => { this.isStartHovered = true; });
      this.playerNameInput.addEventListener('blur', () => { this.isStartHovered = false; });
    }

    // Menu Navigation
    document.getElementById('btn-open-leaderboard')?.addEventListener('click', () => {
      this.openLeaderboard('START');
    });

    document.getElementById('btn-open-howtoplay')?.addEventListener('click', () => {
      this.openHowToPlay();
    });

    document.getElementById('btn-close-howtoplay')?.addEventListener('click', () => {
      this.closeHowToPlay();
    });

    document.getElementById('btn-pause-leaderboard')?.addEventListener('click', () => {
      this.openLeaderboard('PAUSE');
    });

    document.getElementById('btn-gameover-leaderboard')?.addEventListener('click', () => {
      this.openLeaderboard('GAMEOVER');
    });

    document.getElementById('btn-close-leaderboard')?.addEventListener('click', () => {
      this.closeLeaderboard();
    });

    document.getElementById('btn-clear-leaderboard')?.addEventListener('click', () => {
      this.clearLeaderboardRecords();
    });

    document.getElementById('btn-pause')?.addEventListener('click', () => this.pauseGame());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      this.pauseScreen.classList.remove('active');
      this.startCountdownSequence();
    });
    document.getElementById('btn-pause-home')?.addEventListener('click', () => this.showHome());

    document.getElementById('btn-gameover-restart')?.addEventListener('click', () => {
      this.gameoverScreen.classList.remove('active');
      this.startCountdownSequence();
    });

    document.getElementById('btn-gameover-home')?.addEventListener('click', () => this.showHome());

    // Sound Toggles (HUD and Menu header)
    const toggleSoundAction = () => {
      const isMuted = sounds.toggleMute();
      const icon = isMuted ? '🔇' : '🔊';
      const text = isMuted ? 'SOUND OFF' : 'SOUND ON';

      const hudAudioBtn = document.getElementById('btn-audio');
      if (hudAudioBtn) hudAudioBtn.textContent = icon;

      const menuAudioIcon = document.getElementById('menu-audio-icon');
      if (menuAudioIcon) menuAudioIcon.textContent = icon;

      const menuAudioBtn = document.getElementById('btn-menu-audio');
      if (menuAudioBtn) {
        menuAudioBtn.innerHTML = `<span>${icon}</span> ${text}`;
      }
    };

    document.getElementById('btn-audio')?.addEventListener('click', toggleSoundAction);
    document.getElementById('btn-menu-audio')?.addEventListener('click', toggleSoundAction);

    window.addEventListener('resize', () => {
      if (!this.renderer || !this.camera) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.gameState === 'PLAYING') {
        this.pauseGame();
      }
    });
  }
}

// Boot application upon DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new InternetIsBrokenGame();
});
