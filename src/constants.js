import * as THREE from 'three';

export const TERRAIN_SIZE = 400;
export const DUST_COLOR = 0xd19a63;

const SUN_ELEVATION = 8;
const SUN_AZIMUTH = 200;

export const SUN_DIRECTION = new THREE.Vector3().setFromSphericalCoords(
  1,
  THREE.MathUtils.degToRad(90 - SUN_ELEVATION),
  THREE.MathUtils.degToRad(SUN_AZIMUTH)
);
