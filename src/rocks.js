import * as THREE from 'three';
import { displaceGeometry, seededRandom } from './noise.js';
import { getHeight } from './terrain.js';

const ROCK_COUNT = 600;
const ROCK_SHAPES = 4;
const CLEAR_RADIUS = 9;
const SPREAD_RADIUS = 150;
const DARK_ROCK = new THREE.Color(0x4f3328);
const LIGHT_ROCK = new THREE.Color(0x8a5a40);

export function createRocks(scene) {
  const random = seededRandom(42);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, flatShading: true });
  const perShape = Math.floor(ROCK_COUNT / ROCK_SHAPES);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const rocks = new THREE.Group();

  for (let shape = 0; shape < ROCK_SHAPES; shape++) {
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    displaceGeometry(geometry, 0.45, 1.3, 100 + shape * 13);

    const mesh = new THREE.InstancedMesh(geometry, material, perShape);
    for (let i = 0; i < perShape; i++) {
      // Most rocks are pebbles near the camera, a few are boulders
      const radius = CLEAR_RADIUS + Math.pow(random(), 1.3) * SPREAD_RADIUS;
      const angle = random() * Math.PI * 2;
      const size = 0.1 + Math.pow(random(), 5) * 2.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      dummy.position.set(x, getHeight(x, z) - size * 0.2, z);
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      dummy.scale.set(size * (0.7 + random() * 0.6), size * (0.5 + random() * 0.4), size * (0.7 + random() * 0.6));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.lerpColors(DARK_ROCK, LIGHT_ROCK, random()));
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    rocks.add(mesh);
  }

  scene.add(rocks);
  return rocks;
}
