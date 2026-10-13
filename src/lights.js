import * as THREE from 'three';
import { SUN_DIRECTION } from './constants.js';

const SUN_DISTANCE = 220;
const SHADOW_EXTENT = 75;

export function createLights(scene) {
  const sun = new THREE.DirectionalLight(0xffb478, 12);
  sun.position.copy(SUN_DIRECTION).multiplyScalar(SUN_DISTANCE);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -SHADOW_EXTENT;
  sun.shadow.camera.right = SHADOW_EXTENT;
  sun.shadow.camera.top = SHADOW_EXTENT;
  sun.shadow.camera.bottom = -SHADOW_EXTENT;
  sun.shadow.camera.near = 80;
  sun.shadow.camera.far = 380;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.2;
  sun.shadow.radius = 4;
  scene.add(sun);

  const fill = new THREE.HemisphereLight(0xd9a070, 0x4a2a1a, 1.1);
  scene.add(fill);

  return { sun, fill };
}
