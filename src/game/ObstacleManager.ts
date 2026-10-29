/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ObstacleInstance, ObstacleType } from '../types/game';
import { createHazardTexture } from './textures';

/**
 * Manages procedural 3D obstacle generation, visual fidelity, and bounding volume updates
 */
export class ObstacleManager {
  public obstacles: ObstacleInstance[] = [];
  public container: THREE.Group;
  private nextId: number = 1;
  private lastSpawnZ: number = -20;
  private trackWidth: number = 7.5; // playable lateral span: -3.75 to +3.75

  // Shared reusable materials
  private serverMonolithMaterial: THREE.MeshStandardMaterial;
  private lowWallMaterial: THREE.MeshStandardMaterial;
  private hazardBorderMaterial: THREE.MeshBasicMaterial;
  private laserBeamMaterial: THREE.MeshBasicMaterial;
  private laserFrameMaterial: THREE.MeshStandardMaterial;
  private dataCrystalMaterial: THREE.MeshBasicMaterial;
  private neonGlowRed: THREE.MeshBasicMaterial;
  private neonGlowCyan: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.container = new THREE.Group();
    scene.add(this.container);

    const hazardTex = createHazardTexture();
    hazardTex.repeat.set(2, 1);

    this.serverMonolithMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
    });

    this.lowWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.35,
    });

    this.hazardBorderMaterial = new THREE.MeshBasicMaterial({
      map: hazardTex,
    });

    this.laserBeamMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.85,
    });

    this.laserFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2,
    });

    this.dataCrystalMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Glowing emerald crypto packet
      wireframe: false,
    });

    this.neonGlowRed = new THREE.MeshBasicMaterial({
      color: 0xff0055,
    });

    this.neonGlowCyan = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
    });
  }

  /**
   * Spawns procedural obstacles along the negative Z axis
   */
  public update(playerZ: number, speed: number, isGlitching: boolean, delta: number): void {
    // 1. Maintain obstacle spawn horizon ahead of player
    const spawnDistanceAhead = 120;
    // Spacing formula: at 25 units/s -> ~28 units apart; at 40 units/s -> ~45 units apart
    // During glitches, grant slightly more generous spacing (+20%) to keep it challenging yet fair
    const baseSpacing = Math.max(26, speed * 1.15);
    const spacing = isGlitching ? baseSpacing * 1.25 : baseSpacing;

    while (this.lastSpawnZ > playerZ - spawnDistanceAhead) {
      this.lastSpawnZ -= spacing + (Math.random() * 8);
      this.spawnRandomObstacle(this.lastSpawnZ, isGlitching);
    }

    // 2. Animate dynamic elements (rotating data crystals, pulsing lasers)
    const time = Date.now() * 0.003;
    for (const obs of this.obstacles) {
      if (obs.type === 'DATA_CRYSTAL') {
        obs.group.rotation.y += delta * 3.0;
        obs.group.position.y = 1.1 + Math.sin(time + obs.id) * 0.2;
      }
    }

    // 3. Cull obstacles behind player
    const cullZ = playerZ + 20;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.z > cullZ) {
        this.container.remove(obs.group);
        this.disposeGroup(obs.group);
        this.obstacles.splice(i, 1);
      }
    }
  }

  private spawnRandomObstacle(z: number, isGlitching: boolean): void {
    // Select obstacle type:
    // 0: Tall barrier (dodge)
    // 1: Low wall (jump)
    // 2: Laser overhang (slide)
    // 3: Collectible bonus packet
    const rand = Math.random();
    let type: ObstacleType;
    if (rand < 0.35) {
      type = 'TALL_BARRIER';
    } else if (rand < 0.65) {
      type = 'LOW_WALL';
    } else if (rand < 0.88) {
      type = 'LASER_OVERHANG';
    } else {
      type = 'DATA_CRYSTAL';
    }

    let group: THREE.Group;
    let collider: THREE.Box3;
    let x = 0;

    switch (type) {
      case 'TALL_BARRIER': {
        // Monolith placed either left, center, or right with guaranteed dodge room
        const laneChoice = Math.random();
        if (laneChoice < 0.45) {
          x = -1.8; // Block left
        } else if (laneChoice < 0.9) {
          x = 1.8;  // Block right
        } else {
          x = 0;    // Block center
        }
        const width = 2.8;
        const height = 4.2;
        const depth = 1.2;

        group = new THREE.Group();
        group.position.set(x, 0, z);

        // Core monolith
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.serverMonolithMaterial);
        mesh.position.y = height / 2;
        mesh.castShadow = true;
        group.add(mesh);

        // Warning hazard stripes on front face
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, 0.05), this.hazardBorderMaterial);
        stripe.position.set(0, height / 2, depth / 2 + 0.03);
        group.add(stripe);

        // Glowing red neon edges
        const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, height, 0.1), this.neonGlowRed);
        edgeL.position.set(-width / 2, height / 2, depth / 2);
        const edgeR = edgeL.clone();
        edgeR.position.x = width / 2;
        group.add(edgeL);
        group.add(edgeR);

        collider = new THREE.Box3(
          new THREE.Vector3(x - width / 2, 0, z - depth / 2),
          new THREE.Vector3(x + width / 2, height, z + depth / 2)
        );
        break;
      }

      case 'LOW_WALL': {
        // Spans majority of track, must jump!
        x = 0;
        const width = 7.0;
        const height = 0.85; // Low enough for jump
        const depth = 0.8;

        group = new THREE.Group();
        group.position.set(x, 0, z);

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.lowWallMaterial);
        mesh.position.y = height / 2;
        mesh.castShadow = true;
        group.add(mesh);

        // Hazard top bar
        const topStripe = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth + 0.02), this.hazardBorderMaterial);
        topStripe.position.set(0, height, 0);
        group.add(topStripe);

        // Glowing cyan energy line
        const neonLine = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.04), this.neonGlowCyan);
        neonLine.position.set(0, height / 2, depth / 2 + 0.02);
        group.add(neonLine);

        // Jump collider only covers height up to 0.85
        collider = new THREE.Box3(
          new THREE.Vector3(x - width / 2, 0, z - depth / 2),
          new THREE.Vector3(x + width / 2, height, z + depth / 2)
        );
        break;
      }

      case 'LASER_OVERHANG': {
        // High laser beam with ~0.8m ground clearance. Must slide!
        x = 0;
        const width = 7.6;
        const groundClearance = 0.8;
        const beamThickness = 0.5;
        const depth = 0.6;

        group = new THREE.Group();
        group.position.set(x, 0, z);

        // Left & Right pillar posts
        const postGeom = new THREE.BoxGeometry(0.5, 3.8, 0.5);
        const postL = new THREE.Mesh(postGeom, this.laserFrameMaterial);
        postL.position.set(-width / 2 + 0.25, 1.9, 0);
        const postR = postL.clone();
        postR.position.x = width / 2 - 0.25;
        group.add(postL);
        group.add(postR);

        // Upper housing crossbar
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, 0.6), this.laserFrameMaterial);
        topBar.position.set(0, 3.2, 0);
        group.add(topBar);

        // Glowing red deadly laser beam sheet (suspended from clearance up to 2.8m)
        const beamGeom = new THREE.BoxGeometry(width - 0.6, 1.8, 0.1);
        const beamMesh = new THREE.Mesh(beamGeom, this.laserBeamMaterial);
        beamMesh.position.set(0, groundClearance + 0.9, 0);
        group.add(beamMesh);

        // Laser warning indicator
        const warningLight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), this.neonGlowRed);
        warningLight.position.set(0, 3.0, 0.3);
        group.add(warningLight);

        // Laser collider: Y starts at groundClearance (0.8m) and reaches up to 2.8m!
        collider = new THREE.Box3(
          new THREE.Vector3(x - width / 2 + 0.3, groundClearance, z - depth / 2),
          new THREE.Vector3(x + width / 2 - 0.3, 2.8, z + depth / 2)
        );
        break;
      }

      case 'DATA_CRYSTAL':
      default: {
        // Green spinning cyber data packet
        x = (Math.random() - 0.5) * (this.trackWidth - 2.0);
        const size = 0.55;

        group = new THREE.Group();
        group.position.set(x, 1.1, z);

        const crystalGeom = new THREE.OctahedronGeometry(size, 0);
        const crystalMesh = new THREE.Mesh(crystalGeom, this.dataCrystalMaterial);
        group.add(crystalMesh);

        // Inner glowing core
        const innerGeom = new THREE.BoxGeometry(size * 0.4, size * 0.4, size * 0.4);
        const innerMesh = new THREE.Mesh(innerGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        group.add(innerMesh);

        collider = new THREE.Box3(
          new THREE.Vector3(x - 0.4, 0.4, z - 0.4),
          new THREE.Vector3(x + 0.4, 2.0, z + 0.4)
        );
        break;
      }
    }

    this.container.add(group);
    this.obstacles.push({
      id: this.nextId++,
      type,
      group,
      collider,
      z,
      x,
      passed: false,
    });
  }

  public reset(): void {
    for (const obs of this.obstacles) {
      this.container.remove(obs.group);
      this.disposeGroup(obs.group);
    }
    this.obstacles = [];
    this.lastSpawnZ = -20;
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  }

  public dispose(): void {
    this.reset();
    this.serverMonolithMaterial.dispose();
    this.lowWallMaterial.dispose();
    this.hazardBorderMaterial.dispose();
    this.laserBeamMaterial.dispose();
    this.laserFrameMaterial.dispose();
    this.dataCrystalMaterial.dispose();
    this.neonGlowRed.dispose();
    this.neonGlowCyan.dispose();
  }
}
