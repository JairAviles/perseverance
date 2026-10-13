import * as THREE from 'three';
import { SUN_DIRECTION } from './constants.js';
import { displaceGeometry } from './noise.js';

const MOON_DISTANCE = 800;

// Sizes are exaggerated so both moons read on screen
const MOONS = [
  { name: 'phobos', azimuth: 170, elevation: 17, radius: 11, squash: [1, 0.82, 0.76], lumpiness: 0.22, color: 0xe6d2b8, seed: 3 },
  { name: 'deimos', azimuth: 213, elevation: 15, radius: 5, squash: [1, 0.85, 0.8], lumpiness: 0.14, color: 0xd9c8b4, seed: 8 },
];

const vertexShader = /* glsl */ `
  varying vec3 vWorldNormal;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 lightDirection;
  uniform vec3 moonColor;
  varying vec3 vWorldNormal;

  void main() {
    float light = smoothstep(-0.3, 0.55, dot(normalize(vWorldNormal), lightDirection));
    // The unlit side fades into the dusty sky instead of going dark
    gl_FragColor = vec4(moonColor * (0.5 + 0.5 * light), mix(0.12, 1.0, light));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createMoon({ name, azimuth, elevation, radius, squash, lumpiness, color, seed }) {
  const direction = new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - elevation),
    THREE.MathUtils.degToRad(azimuth)
  );
  // Light the limb that faces the sun, tilted toward the viewer for a gibbous phase
  const towardSun = SUN_DIRECTION.clone().addScaledVector(direction, -SUN_DIRECTION.dot(direction)).normalize();
  const lightDirection = towardSun.addScaledVector(direction, -1).normalize();

  const geometry = new THREE.SphereGeometry(1, 32, 16);
  displaceGeometry(geometry, lumpiness, 1.4, seed);

  const moon = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        lightDirection: { value: lightDirection },
        moonColor: { value: new THREE.Color(color) },
      },
      transparent: true,
      depthWrite: false,
      fog: false,
    })
  );
  moon.name = name;
  moon.position.copy(direction).multiplyScalar(MOON_DISTANCE);
  moon.scale.set(radius * squash[0], radius * squash[1], radius * squash[2]);
  moon.rotation.set(seed, seed * 2, seed * 3);
  return moon;
}

export function createMoons(scene) {
  const moons = new THREE.Group();
  MOONS.forEach((config) => moons.add(createMoon(config)));
  scene.add(moons);
  return moons;
}
