/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createCyberGridTexture, create404GlitchTexture } from './textures';

/**
 * Procedural infinite sci-fi tunnel environment with 404 texture glitching,
 * speed lines, and neon cyber arches.
 */
export class TunnelManager {
  public group: THREE.Group;
  private renderer?: THREE.WebGLRenderer;

  // Materials & Textures
  private cyberGridTexture: THREE.CanvasTexture;
  private glitch404Texture: THREE.CanvasTexture;
  private tunnelMaterial: THREE.MeshStandardMaterial;
  private wallMaterial: THREE.MeshStandardMaterial;
  private archMaterialCyan: THREE.MeshBasicMaterial;
  private archMaterialGlitch: THREE.MeshBasicMaterial;

  // Tunnel chunks
  private segments: THREE.Mesh[] = [];
  private arches: THREE.Group[] = [];
  private speedParticles: THREE.Points;
  private segmentLength: number = 60;
  private segmentCount: number = 6;
  private trackWidth: number = 8.0;
  private wallHeight: number = 6.0;

  private isGlitchActive: boolean = false;

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.renderer = renderer;

    this.cyberGridTexture = createCyberGridTexture(this.renderer);
    this.glitch404Texture = create404GlitchTexture(this.renderer);

    this.tunnelMaterial = new THREE.MeshStandardMaterial({
      map: this.cyberGridTexture,
      roughness: 0.35,
      metalness: 0.8,
    });

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: this.cyberGridTexture,
      roughness: 0.4,
      metalness: 0.75,
      color: 0x8899aa,
    });

    this.archMaterialCyan = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
    });

    this.archMaterialGlitch = new THREE.MeshBasicMaterial({
      color: 0xff007f,
    });

    // 1. Build modular tunnel floor segments
    const floorGeom = new THREE.PlaneGeometry(this.trackWidth, this.segmentLength);
    floorGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < this.segmentCount; i++) {
      const z = -i * this.segmentLength;
      
      // Floor
      const floor = new THREE.Mesh(floorGeom, this.tunnelMaterial);
      floor.position.set(0, 0, z - this.segmentLength / 2);
      floor.receiveShadow = true;
      this.group.add(floor);
      this.segments.push(floor);

      // Left Wall
      const wallGeom = new THREE.PlaneGeometry(this.segmentLength, this.wallHeight);
      wallGeom.rotateY(Math.PI / 2);
      const leftWall = new THREE.Mesh(wallGeom, this.wallMaterial);
      leftWall.position.set(-this.trackWidth / 2, this.wallHeight / 2, z - this.segmentLength / 2);
      this.group.add(leftWall);

      // Right Wall
      const rightWall = new THREE.Mesh(wallGeom, this.wallMaterial);
      rightWall.position.set(this.trackWidth / 2, this.wallHeight / 2, z - this.segmentLength / 2);
      rightWall.rotateY(Math.PI);
      this.group.add(rightWall);

      // Glowing light strips along floor edges
      const stripGeom = new THREE.BoxGeometry(0.12, 0.08, this.segmentLength);
      const stripL = new THREE.Mesh(stripGeom, this.archMaterialCyan);
      stripL.position.set(-this.trackWidth / 2, 0.04, z - this.segmentLength / 2);
      this.group.add(stripL);

      const stripR = new THREE.Mesh(stripGeom, this.archMaterialCyan);
      stripR.position.set(this.trackWidth / 2, 0.04, z - this.segmentLength / 2);
      this.group.add(stripR);
    }

    // 2. Neon Cyber Arches spaced along the tunnel
    for (let i = 0; i < 18; i++) {
      const arch = this.createCyberArch();
      arch.position.set(0, 0, -i * 20);
      this.group.add(arch);
      this.arches.push(arch);
    }

    // 3. Speed Lines / Warp Dust particles
    const particleCount = 200;
    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * (this.trackWidth - 1.0);
      positions[i * 3 + 1] = 0.5 + Math.random() * 3.5;
      positions[i * 3 + 2] = -Math.random() * 200;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.75,
    });
    this.speedParticles = new THREE.Points(pGeom, pMat);
    this.group.add(this.speedParticles);
  }

  private createCyberArch(): THREE.Group {
    const archGroup = new THREE.Group();
    const halfW = this.trackWidth / 2;
    const archHeight = 4.8;
    const thickness = 0.25;

    // Left vertical post
    const postGeom = new THREE.BoxGeometry(thickness, archHeight, thickness);
    const postL = new THREE.Mesh(postGeom, this.archMaterialCyan);
    postL.position.set(-halfW, archHeight / 2, 0);
    archGroup.add(postL);

    // Right vertical post
    const postR = new THREE.Mesh(postGeom, this.archMaterialCyan);
    postR.position.set(halfW, archHeight / 2, 0);
    archGroup.add(postR);

    // Crossbar
    const crossGeom = new THREE.BoxGeometry(this.trackWidth + thickness, thickness, thickness);
    const cross = new THREE.Mesh(crossGeom, this.archMaterialCyan);
    cross.position.set(0, archHeight, 0);
    archGroup.add(cross);

    return archGroup;
  }

  /**
   * Recycle tunnel segments and speed lines forward relative to player position
   */
  public update(playerZ: number, speed: number, delta: number): void {
    // 1. Recycle tunnel segments
    const totalLength = this.segmentCount * this.segmentLength;
    this.group.children.forEach((child) => {
      // If any tunnel chunk falls far behind player, shift it ahead
      if (child.position.z > playerZ + this.segmentLength) {
        child.position.z -= totalLength;
      }
    });

    // 2. Recycle arches
    const archSpacing = 20;
    const totalArchSpan = this.arches.length * archSpacing;
    this.arches.forEach((arch) => {
      if (arch.position.z > playerZ + 15) {
        arch.position.z -= totalArchSpan;
      }
    });

    // 3. Update speed dust particles
    const positions = this.speedParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length / 3; i++) {
      // If particle falls behind camera, reset far ahead
      if (positions[i * 3 + 2] > playerZ + 10) {
        positions[i * 3 + 2] = playerZ - 120 - Math.random() * 50;
        positions[i * 3] = (Math.random() - 0.5) * (this.trackWidth - 1.0);
        positions[i * 3 + 1] = 0.5 + Math.random() * 3.5;
      }
    }
    this.speedParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Set 404 Glitch state (switch to pink/black checkerboard)
   */
  public setGlitchMode(active: boolean): void {
    if (this.isGlitchActive === active) return;
    this.isGlitchActive = active;

    if (active) {
      this.tunnelMaterial.map = this.glitch404Texture;
      this.wallMaterial.map = this.glitch404Texture;
      this.tunnelMaterial.needsUpdate = true;
      this.wallMaterial.needsUpdate = true;
      this.archMaterialCyan.color.setHex(0xff007f);
    } else {
      this.tunnelMaterial.map = this.cyberGridTexture;
      this.wallMaterial.map = this.cyberGridTexture;
      this.tunnelMaterial.needsUpdate = true;
      this.wallMaterial.needsUpdate = true;
      this.archMaterialCyan.color.setHex(0x00f3ff);
    }
  }

  public reset(): void {
    this.setGlitchMode(false);
    // Reset arch positions
    for (let i = 0; i < this.arches.length; i++) {
      this.arches[i].position.set(0, 0, -i * 20);
    }
  }

  public dispose(): void {
    this.cyberGridTexture.dispose();
    this.glitch404Texture.dispose();
    this.tunnelMaterial.dispose();
    this.wallMaterial.dispose();
    this.archMaterialCyan.dispose();
    this.archMaterialGlitch.dispose();
    this.speedParticles.geometry.dispose();
  }
}
