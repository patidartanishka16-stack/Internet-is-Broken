/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Procedural texture generator conforming to Three.js SRGBColorSpace & zero-404 guidelines
 */

/**
 * Generates the normal sci-fi cyber tunnel grid texture
 */
export function createCyberGridTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark metallic slate background
  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, 512, 512);

  // Sub-grid fine lines
  ctx.strokeStyle = '#0e243a';
  ctx.lineWidth = 1.5;
  const step = 32;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Primary glowing cyan grid lines
  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 12;
  const majorStep = 128;
  for (let x = 0; x <= 512; x += majorStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += majorStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Circuit trace nodes
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#38bdf8';
  for (let x = 0; x <= 512; x += majorStep) {
    for (let y = 0; y <= 512; y += majorStep) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 20);
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return texture;
}

/**
 * Generates the disorienting 404 missing-texture magenta/black checkerboard
 */
export function create404GlitchTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const tileSize = 64;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const isMagenta = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isMagenta ? '#ff007f' : '#0a0a0a';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  // Stamp "404" & "ERR_CONN_LOST" glitch text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let y = tileSize; y < 512; y += tileSize * 2) {
    for (let x = tileSize; x < 512; x += tileSize * 2) {
      ctx.fillText('404', x, y);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 20);
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return texture;
}

/**
 * Generates diagonal hazard warning stripes for barrier borders
 */
export function createHazardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#0f172a';
  const stripeWidth = 32;
  for (let i = -256; i < 512; i += stripeWidth * 2) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeWidth, 0);
    ctx.lineTo(i + stripeWidth + 256, 256);
    ctx.lineTo(i + 256, 256);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
