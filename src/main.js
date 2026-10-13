import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DUST_COLOR } from './constants.js';
import { createDust } from './dust.js';
import { createLights } from './lights.js';
import { createMoons } from './moons.js';
import { createRocks } from './rocks.js';
import { createRover } from './rover.js';
import { createSky } from './sky.js';
import { createTerrain, getGroundHeight } from './terrain.js';
import { createTracks } from './tracks.js';

const CAMERA_CLEARANCE = 0.6;
const CAMERA_TARGET_HEIGHT = 1.2;
// Starting camera position relative to the rover: x left, y up, z forward
const CAMERA_OFFSET = new THREE.Vector3(-2.5, 1.8, -7.5);
const UP = new THREE.Vector3(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(DUST_COLOR);

createSky(scene);
const lights = createLights(scene);
createTerrain(scene);
createRocks(scene);
createMoons(scene);
const dust = createDust(scene);
const rover = createRover(scene);
const tracks = createTracks(scene);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(rover.group.position).y += CAMERA_TARGET_HEIGHT;
camera.position.copy(CAMERA_OFFSET).applyAxisAngle(UP, rover.heading).add(controls.target);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 3;
controls.maxDistance = 60;

const followOffset = new THREE.Vector3();
let lastHeading = rover.heading;

// Moves and turns the camera with the rover, keeping whatever angle the user orbited to
function followRover() {
  followOffset.copy(camera.position).sub(controls.target);
  followOffset.applyAxisAngle(UP, rover.heading - lastHeading);
  lastHeading = rover.heading;
  controls.target.copy(rover.group.position).y += CAMERA_TARGET_HEIGHT;
  camera.position.copy(controls.target).add(followOffset);
}

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

  rover.update(delta);
  tracks.update(rover.group.position, rover.heading);
  followRover();
  controls.update();
  // Keep the camera above the dunes
  const floor = getGroundHeight(camera.position.x, camera.position.z) + CAMERA_CLEARANCE;
  if (camera.position.y < floor) camera.position.y = floor;

  lights.update(rover.group.position);
  dust.update(delta, seconds, rover.group.position);
  renderer.render(scene, camera);
  window.__ready = rover.ready;
});
