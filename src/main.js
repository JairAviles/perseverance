import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DUST_COLOR } from './constants.js';
import { createDust } from './dust.js';
import { createLights } from './lights.js';
import { createMoons } from './moons.js';
import { createRocks } from './rocks.js';
import { createSky } from './sky.js';
import { createTerrain, getHeight } from './terrain.js';

const CAMERA_CLEARANCE = 1.2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(DUST_COLOR);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(5, getHeight(5, 24) + 1.7, 24);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, getHeight(0, 0) + 4.5, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 5;
controls.maxDistance = 120;
// Slow cinematic drift until the user takes over
controls.autoRotate = true;
controls.autoRotateSpeed = 0.12;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
});

createSky(scene);
createLights(scene);
createTerrain(scene);
createRocks(scene);
createMoons(scene);
const dust = createDust(scene);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = 0;
renderer.setAnimationLoop((time) => {
  const seconds = time / 1000;
  const delta = Math.min(seconds - lastTime, 0.1);
  lastTime = seconds;

  controls.update();
  // Keep the camera above the dunes
  const floor = getHeight(camera.position.x, camera.position.z) + CAMERA_CLEARANCE;
  if (camera.position.y < floor) camera.position.y = floor;

  dust.update(delta, seconds);
  renderer.render(scene, camera);
  window.__ready = true;
});
