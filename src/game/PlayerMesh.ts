/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * 3D Procedural Cyber Runner character model
 * Composed of 10 distinct articulated parts:
 * 1. Torso Chassis (primary hull)
 * 2. Power Core (luminescent reactor)
 * 3. Cyber Visor / Helmet (accent)
 * 4. Neck & Collar Plate
 * 5. Left Shoulder & Thruster Pod
 * 6. Right Shoulder & Thruster Pod
 * 7. Left Upper Arm & Forearm
 * 8. Right Upper Arm & Forearm
 * 9. Left Articulated Leg (Thigh, Shin, Foot)
 * 10. Right Articulated Leg (Thigh, Shin, Foot)
 * Plus thruster trail glow sprites & shield sphere.
 */
export class PlayerMesh {
  public group: THREE.Group;
  public boundingBox: THREE.Box3;
  
  // Limb references for dynamic animation
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private visorMesh: THREE.Mesh;
  private powerCoreMesh: THREE.Mesh;
  private thrusterGlowL: THREE.PointLight;
  private thrusterGlowR: THREE.PointLight;
  private shieldMesh: THREE.Mesh;

  // Materials for invulnerability flash & glitch FX
  private hullMaterial: THREE.MeshStandardMaterial;
  private accentMaterial: THREE.MeshStandardMaterial;
  private glowCyanMaterial: THREE.MeshBasicMaterial;
  private shieldMaterial: THREE.MeshBasicMaterial;

  private runCycleTime: number = 0;
  public isSliding: boolean = false;
  public isJumping: boolean = false;
  public jumpHeight: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.boundingBox = new THREE.Box3();

    // 1. Materials with varied roughness and metalness
    this.hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827, // Dark carbon alloy
      metalness: 0.85,
      roughness: 0.25,
    });

    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.45,
    });

    this.glowCyanMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
    });

    // 2. Torso Group
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.95, 0); // Center of mass

    // Main torso armor plate (chamfered box)
    const torsoGeom = new THREE.BoxGeometry(0.5, 0.6, 0.35);
    const torsoMesh = new THREE.Mesh(torsoGeom, this.hullMaterial);
    torsoMesh.castShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Glowing Power Core (Arc reactor on chest)
    const coreGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    coreGeom.rotateX(Math.PI / 2);
    this.powerCoreMesh = new THREE.Mesh(coreGeom, this.glowCyanMaterial);
    this.powerCoreMesh.position.set(0, 0.05, 0.18);
    this.torsoGroup.add(this.powerCoreMesh);

    // Back Jetpack Booster
    const jetpackGeom = new THREE.BoxGeometry(0.32, 0.45, 0.16);
    const jetpackMesh = new THREE.Mesh(jetpackGeom, this.accentMaterial);
    jetpackMesh.position.set(0, 0.02, -0.22);
    this.torsoGroup.add(jetpackMesh);

    // Jetpack nozzles
    const nozzleGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.1, 12);
    const nozzleL = new THREE.Mesh(nozzleGeom, this.accentMaterial);
    nozzleL.position.set(-0.1, -0.25, -0.22);
    const nozzleR = nozzleL.clone();
    nozzleR.position.x = 0.1;
    this.torsoGroup.add(nozzleL);
    this.torsoGroup.add(nozzleR);

    // Thruster exhaust lights
    this.thrusterGlowL = new THREE.PointLight(0x00f3ff, 1.2, 2.5);
    this.thrusterGlowL.position.set(-0.1, -0.35, -0.22);
    this.torsoGroup.add(this.thrusterGlowL);

    this.thrusterGlowR = new THREE.PointLight(0x00f3ff, 1.2, 2.5);
    this.thrusterGlowR.position.set(0.1, -0.35, -0.22);
    this.torsoGroup.add(this.thrusterGlowR);

    // Head / Cyber Helmet
    const headGeom = new THREE.BoxGeometry(0.26, 0.28, 0.28);
    const headMesh = new THREE.Mesh(headGeom, this.hullMaterial);
    headMesh.position.set(0, 0.45, 0.02);
    this.torsoGroup.add(headMesh);

    // Glowing Visor Strip
    const visorGeom = new THREE.BoxGeometry(0.24, 0.07, 0.06);
    this.visorMesh = new THREE.Mesh(visorGeom, this.glowCyanMaterial);
    this.visorMesh.position.set(0, 0.45, 0.16);
    this.torsoGroup.add(this.visorMesh);

    // Shoulders
    const shoulderGeom = new THREE.BoxGeometry(0.14, 0.14, 0.18);
    const shoulderL = new THREE.Mesh(shoulderGeom, this.accentMaterial);
    shoulderL.position.set(-0.32, 0.22, 0);
    const shoulderR = new THREE.Mesh(shoulderGeom, this.accentMaterial);
    shoulderR.position.set(0.32, 0.22, 0);
    this.torsoGroup.add(shoulderL);
    this.torsoGroup.add(shoulderR);

    // Arms
    this.leftArmGroup = this.createArm(-1);
    this.leftArmGroup.position.set(-0.35, 0.15, 0);
    this.torsoGroup.add(this.leftArmGroup);

    this.rightArmGroup = this.createArm(1);
    this.rightArmGroup.position.set(0.35, 0.15, 0);
    this.torsoGroup.add(this.rightArmGroup);

    this.group.add(this.torsoGroup);

    // 3. Legs
    this.leftLegGroup = this.createLeg(-1);
    this.leftLegGroup.position.set(-0.16, 0.75, 0);
    this.group.add(this.leftLegGroup);

    this.rightLegGroup = this.createLeg(1);
    this.rightLegGroup.position.set(0.16, 0.75, 0);
    this.group.add(this.rightLegGroup);

    // 4. Force Shield Sphere (activated during invulnerability flash)
    const shieldGeom = new THREE.SphereGeometry(1.0, 16, 16);
    this.shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeom, this.shieldMaterial);
    this.shieldMesh.position.set(0, 0.9, 0);
    this.group.add(this.shieldMesh);

    // Update initial bounding box
    this.updateCollider();
  }

  private createArm(side: number): THREE.Group {
    const armGroup = new THREE.Group();
    // Upper arm
    const upperArmGeom = new THREE.BoxGeometry(0.1, 0.3, 0.1);
    upperArmGeom.translate(0, -0.15, 0);
    const upperArm = new THREE.Mesh(upperArmGeom, this.hullMaterial);
    armGroup.add(upperArm);

    // Forearm
    const forearmGeom = new THREE.BoxGeometry(0.09, 0.28, 0.09);
    forearmGeom.translate(0, -0.4, 0.06);
    const forearm = new THREE.Mesh(forearmGeom, this.accentMaterial);
    armGroup.add(forearm);

    return armGroup;
  }

  private createLeg(side: number): THREE.Group {
    const legGroup = new THREE.Group();
    
    // Thigh
    const thighGeom = new THREE.BoxGeometry(0.14, 0.38, 0.14);
    thighGeom.translate(0, -0.19, 0);
    const thigh = new THREE.Mesh(thighGeom, this.hullMaterial);
    legGroup.add(thigh);

    // Shin
    const shinGeom = new THREE.BoxGeometry(0.12, 0.36, 0.12);
    shinGeom.translate(0, -0.52, -0.02);
    const shin = new THREE.Mesh(shinGeom, this.accentMaterial);
    legGroup.add(shin);

    // Cyber Boot
    const bootGeom = new THREE.BoxGeometry(0.14, 0.1, 0.24);
    bootGeom.translate(0, -0.7, 0.05);
    const boot = new THREE.Mesh(bootGeom, this.hullMaterial);
    legGroup.add(boot);

    return legGroup;
  }

  /**
   * Update animation frame: run cycles, jump arc, slide crouch, banking tilt
   */
  public update(
    delta: number,
    forwardSpeed: number,
    lateralVelocity: number,
    isInvulnerable: boolean,
    isGlitching: boolean
  ): void {
    this.runCycleTime += delta * forwardSpeed * 0.45;

    // 1. Invulnerability visual feedback (flicker & shield pulse)
    if (isInvulnerable) {
      const flash = Math.sin(Date.now() * 0.03) > 0;
      this.group.visible = flash;
      this.shieldMesh.visible = true;
      this.shieldMaterial.opacity = 0.35 + Math.sin(Date.now() * 0.02) * 0.2;
    } else {
      this.group.visible = true;
      this.shieldMaterial.opacity = 0;
    }

    // 2. Glitch visor color change (magenta when glitching)
    if (isGlitching) {
      this.glowCyanMaterial.color.setHex(0xff007f);
      this.thrusterGlowL.color.setHex(0xff007f);
      this.thrusterGlowR.color.setHex(0xff007f);
    } else {
      this.glowCyanMaterial.color.setHex(0x00f3ff);
      this.thrusterGlowL.color.setHex(0x00f3ff);
      this.thrusterGlowR.color.setHex(0x00f3ff);
    }

    // 3. Lateral banking tilt (roll into turns)
    const targetRoll = -lateralVelocity * 0.035;
    this.group.rotation.z = THREE.MathUtils.damp(this.group.rotation.z, targetRoll, 10, delta);

    // 4. Stance handling: Slide vs Jump vs Run
    if (this.isSliding) {
      // Crouch low, slide forward on boots with jetpack kicking back
      this.torsoGroup.position.y = THREE.MathUtils.damp(this.torsoGroup.position.y, 0.45, 14, delta);
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, -0.65, 14, delta);

      // Legs stretched out forward in slide stance
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, -1.2, 14, delta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, -1.0, 14, delta);
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, 0.8, 14, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, 0.8, 14, delta);
    } else if (this.isJumping) {
      // In air: tuck legs and pump jetpack
      this.torsoGroup.position.y = 0.95;
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0.25, 12, delta);
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0.6, 12, delta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0.3, 12, delta);
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -0.6, 12, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -0.6, 12, delta);
    } else {
      // Running on ground: cyclical limb swing
      this.torsoGroup.position.y = 0.95 + Math.abs(Math.sin(this.runCycleTime * 2)) * 0.06;
      this.torsoGroup.rotation.x = 0.15; // Aggressive forward running lean

      const swing = Math.sin(this.runCycleTime) * 0.75;
      this.leftLegGroup.rotation.x = swing;
      this.rightLegGroup.rotation.x = -swing;

      this.leftArmGroup.rotation.x = -swing * 0.85;
      this.rightArmGroup.rotation.x = swing * 0.85;
    }

    this.updateCollider();
  }

  /**
   * Recalculates 3D bounding box for collision detection
   */
  public updateCollider(): void {
    const pos = this.group.position;
    if (this.isSliding) {
      // Shrunk bounding box while sliding under laser overhangs
      this.boundingBox.min.set(pos.x - 0.38, pos.y, pos.z - 0.45);
      this.boundingBox.max.set(pos.x + 0.38, pos.y + 0.65, pos.z + 0.45);
    } else {
      // Full upright bounding box
      this.boundingBox.min.set(pos.x - 0.4, pos.y, pos.z - 0.4);
      this.boundingBox.max.set(pos.x + 0.4, pos.y + 1.8, pos.z + 0.4);
    }
  }

  public dispose(): void {
    this.hullMaterial.dispose();
    this.accentMaterial.dispose();
    this.glowCyanMaterial.dispose();
    this.shieldMaterial.dispose();
  }
}
