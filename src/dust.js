import * as THREE from 'three';
import { seededRandom } from './noise.js';

const DUST_COUNT = 2000;
const DUST_AREA = 140;
const DUST_HEIGHT = 16;
const WIND = new THREE.Vector3(1.6, 0, 0.5);

function createDustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function createDust(scene) {
  const random = seededRandom(7);
  const positions = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i++) {
    positions[i * 3] = (random() - 0.5) * DUST_AREA;
    positions[i * 3 + 1] = random() * DUST_HEIGHT;
    positions[i * 3 + 2] = (random() - 0.5) * DUST_AREA;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      map: createDustTexture(),
      color: 0xffd9b0,
      size: 0.3,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  points.frustumCulled = false;
  scene.add(points);

  const half = DUST_AREA / 2;
  const position = geometry.attributes.position;

  // Particles drift with the wind and wrap around the edges of the area
  function update(delta, time) {
    for (let i = 0; i < DUST_COUNT; i++) {
      let x = position.getX(i) + WIND.x * delta;
      let z = position.getZ(i) + WIND.z * delta;
      const y = position.getY(i) + Math.sin(time * 0.5 + i) * 0.15 * delta;
      if (x > half) x -= DUST_AREA;
      if (z > half) z -= DUST_AREA;
      position.setXYZ(i, x, y, z);
    }
    position.needsUpdate = true;
  }

  return { points, update };
}
