import * as THREE from 'three';
import { WHEEL_TRACK } from './rover.js';
import { getGroundHeight } from './terrain.js';

const MAX_SEGMENTS = 6000;
const SEGMENT_LENGTH = 0.25;
const TRACK_WIDTH = 0.38;
const TRACK_LIFT = 0.03;
const TREAD_SPACING = 0.32;
// Each segment is two quads: one per wheel line
const VERTICES_PER_SEGMENT = 12;

function createTreadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  // Soft-edged strip with darker bars where the wheel grousers press in
  const gradient = context.createLinearGradient(0, 0, 64, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  context.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let y = 4; y < 64; y += 16) context.fillRect(8, y, 48, 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createTracks(scene) {
  const positions = new Float32Array(MAX_SEGMENTS * VERTICES_PER_SEGMENT * 3);
  const uvs = new Float32Array(MAX_SEGMENTS * VERTICES_PER_SEGMENT * 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setDrawRange(0, 0);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      map: createTreadTexture(),
      color: 0x24110a,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Edge points of both wheel lines: left outer, left inner, right inner, right outer
  let previous = null;
  let current = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const lastPosition = new THREE.Vector3();
  let segmentCount = 0;
  let travelled = 0;

  function measure(target, position, heading) {
    const leftX = Math.cos(heading);
    const leftZ = -Math.sin(heading);
    const offsets = [
      WHEEL_TRACK / 2 + TRACK_WIDTH / 2,
      WHEEL_TRACK / 2 - TRACK_WIDTH / 2,
      -WHEEL_TRACK / 2 + TRACK_WIDTH / 2,
      -WHEEL_TRACK / 2 - TRACK_WIDTH / 2,
    ];
    offsets.forEach((offset, i) => {
      const x = position.x + leftX * offset;
      const z = position.z + leftZ * offset;
      target[i].set(x, getGroundHeight(x, z) + TRACK_LIFT, z);
    });
  }

  function writeQuad(vertex, a, b, c, d, v0, v1) {
    const corners = [a, b, c, b, d, c];
    const cornerUvs = [0, v0, 1, v0, 0, v1, 1, v0, 1, v1, 0, v1];
    corners.forEach((corner, i) => {
      corner.toArray(positions, (vertex + i) * 3);
      uvs[(vertex + i) * 2] = cornerUvs[i * 2];
      uvs[(vertex + i) * 2 + 1] = cornerUvs[i * 2 + 1];
    });
  }

  // Lays a new piece of track each time the rover has moved far enough
  function update(position, heading) {
    if (!previous) {
      previous = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      measure(previous, position, heading);
      lastPosition.copy(position);
      return;
    }
    const moved = Math.hypot(position.x - lastPosition.x, position.z - lastPosition.z);
    if (moved < SEGMENT_LENGTH) return;

    measure(current, position, heading);
    const v0 = travelled / TREAD_SPACING;
    const v1 = (travelled + moved) / TREAD_SPACING;
    // Once the buffer is full, the oldest segments are overwritten
    const vertex = (segmentCount % MAX_SEGMENTS) * VERTICES_PER_SEGMENT;
    writeQuad(vertex, previous[0], previous[1], current[0], current[1], v0, v1);
    writeQuad(vertex + 6, previous[2], previous[3], current[2], current[3], v0, v1);

    segmentCount++;
    travelled += moved;
    lastPosition.copy(position);
    [previous, current] = [current, previous];

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
    geometry.setDrawRange(0, Math.min(segmentCount, MAX_SEGMENTS) * VERTICES_PER_SEGMENT);
  }

  return { mesh, update };
}
