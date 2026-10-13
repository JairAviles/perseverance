import * as THREE from 'three';
import { TERRAIN_SIZE } from './constants.js';
import { fbm, noise2, smoothstep } from './noise.js';

const SEGMENTS = 256;
const CELL_SIZE = TERRAIN_SIZE / SEGMENTS;
const ROW = SEGMENTS + 1;
const RUST = new THREE.Color(0x8f4a2e);
const OCHRE = new THREE.Color(0xb8825a);
const BASALT = new THREE.Color(0x4a2c22);

const heights = new Float32Array(ROW * ROW);

export function getHeight(x, z) {
  const distance = Math.hypot(x, z);
  const rolling = (fbm(x * 0.006, z * 0.006, 4, 1) - 0.5) * 16;
  // Dune crests run across the sun direction so they catch the low light
  const warp = fbm(x * 0.01, z * 0.01, 2, 7) * 5;
  const ridge = 1 - Math.abs(2 * noise2(x * 0.009, z * 0.03 + warp, 3) - 1);
  const dunes = ridge * ridge * 4;
  const ripples = (fbm(x * 0.12, z * 0.12, 3, 5) - 0.5) * 0.35;
  const rim = smoothstep(110, 200, distance) * fbm(x * 0.015, z * 0.015, 4, 9) * 16;
  // Calmer ground around the origin, where the rover will sit
  const open = 0.3 + 0.7 * smoothstep(8, 70, distance);
  return (rolling + dunes) * open + ripples + rim;
}

// Height of the rendered mesh, following its triangles (getHeight is the smooth source)
export function getGroundHeight(x, z) {
  const half = TERRAIN_SIZE / 2;
  const gridX = THREE.MathUtils.clamp((x + half) / CELL_SIZE, 0, SEGMENTS - 0.0001);
  const gridZ = THREE.MathUtils.clamp((z + half) / CELL_SIZE, 0, SEGMENTS - 0.0001);
  const ix = Math.floor(gridX);
  const iz = Math.floor(gridZ);
  const u = gridX - ix;
  const v = gridZ - iz;
  const a = heights[iz * ROW + ix];
  const b = heights[(iz + 1) * ROW + ix];
  const c = heights[(iz + 1) * ROW + ix + 1];
  const d = heights[iz * ROW + ix + 1];
  return u + v <= 1 ? a + (d - a) * u + (b - a) * v : c + (b - c) * (1 - u) + (d - c) * (1 - v);
}

export function createTerrain(scene) {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    heights[i] = getHeight(position.getX(i), position.getZ(i));
    position.setY(i, heights[i]);
  }
  geometry.computeVertexNormals();

  const normal = geometry.attributes.normal;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const patches = fbm(x * 0.04, z * 0.04, 3, 11);
    const tone = smoothstep(-6, 8, position.getY(i)) * 0.6 + patches * 0.5;
    const slope = 1 - normal.getY(i);
    color.lerpColors(RUST, OCHRE, Math.min(tone, 1));
    color.lerp(BASALT, smoothstep(0.06, 0.3, slope) * 0.6);
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const terrain = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })
  );
  terrain.castShadow = true;
  terrain.receiveShadow = true;
  scene.add(terrain);
  return terrain;
}
