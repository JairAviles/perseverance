import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getGroundHeight } from './terrain.js';
import { createWheels } from './wheels.js';

const MODEL_URL = '/models/perseverance.glb';
const DRACO_PATH = '/draco/';
// Real width across the wheels in metres (1 scene unit = 1 m)
const ROVER_WIDTH = 2.7;
export const WHEEL_TRACK = 2.32;
const WHEEL_BASE = 2.26;
// The real rover tops out near 0.04 m/s, so this is sped up to be drivable
const MAX_SPEED = 1.5;
const ACCELERATION = 2.5;
const TURN_SPEED = 0.5;
const DRIVE_RADIUS = 170;
const START_HEADING = 2.85;
const CAMERA_PART = /cam|watson/i;
const NOT_CAMERA_PART = /cover|wiring|bracket/i;
const WHEEL_STEER_RATE = 4;
const MIN_WHEEL_SPEED = 0.01;
const MAX_ROCKER_ANGLE = 0.35;
// How strongly the rover's metal mirrors the sky
const REFLECTION_INTENSITY = 0.7;

function loadModel(rover, environment) {
  const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(DRACO_PATH));
  loader.load(
    MODEL_URL,
    (gltf) => {
      const model = gltf.scene;
      const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
      model.scale.setScalar(ROVER_WIDTH / size.x);
      size.multiplyScalar(ROVER_WIDTH / size.x);
      Object.assign(rover, createWheels(model));

      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          object.material.envMap = environment;
          object.material.envMapIntensity = REFLECTION_INTENSITY;
        }
        if (object.isCamera || (CAMERA_PART.test(object.name) && !NOT_CAMERA_PART.test(object.name))) {
          rover.cameraParts.push(object.name);
        }
      });

      console.log(`Rover size (m): ${size.x.toFixed(2)} wide, ${size.z.toFixed(2)} long, ${size.y.toFixed(2)} tall`);
      console.log(`Rover camera components: ${rover.cameraParts.join(', ')}`);
      rover.group.add(model);
      rover.ready = true;
    },
    undefined,
    (error) => {
      console.error('Rover model failed to load', error);
      rover.ready = true;
    }
  );
}

export function createRover(scene, environment) {
  const group = new THREE.Group();
  const keys = new Set();
  const forward = new THREE.Vector3();
  const left = new THREE.Vector3();
  const up = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const targetQuaternion = new THREE.Quaternion();
  const rover = { group, heading: START_HEADING, speed: 0, ready: false, cameraParts: [], wheels: [], rockers: [], update };

  window.addEventListener('keydown', (event) => keys.add(event.code));
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  // Rests the rover on the ground, tilted to match the slope under its wheels
  function settle(blend) {
    const { x, z } = group.position;
    const forwardX = Math.sin(rover.heading);
    const forwardZ = Math.cos(rover.heading);
    const halfBase = WHEEL_BASE / 2;
    const halfTrack = WHEEL_TRACK / 2;
    const front = getGroundHeight(x + forwardX * halfBase, z + forwardZ * halfBase);
    const back = getGroundHeight(x - forwardX * halfBase, z - forwardZ * halfBase);
    const leftSide = getGroundHeight(x + forwardZ * halfTrack, z - forwardX * halfTrack);
    const rightSide = getGroundHeight(x - forwardZ * halfTrack, z + forwardX * halfTrack);

    forward.set(forwardX * WHEEL_BASE, front - back, forwardZ * WHEEL_BASE).normalize();
    left.set(forwardZ * WHEEL_TRACK, leftSide - rightSide, -forwardX * WHEEL_TRACK).normalize();
    up.crossVectors(forward, left).normalize();
    left.crossVectors(up, forward);
    targetQuaternion.setFromRotationMatrix(basis.makeBasis(left, up, forward));

    group.quaternion.slerp(targetQuaternion, blend);

    // Each side tips on its own so its front and rear wheels both stay on the ground
    const wheelGround = (wheel) =>
      getGroundHeight(x + forwardZ * wheel.x + forwardX * wheel.z, z - forwardX * wheel.x + forwardZ * wheel.z);
    for (const rocker of rover.rockers) {
      const slope = Math.atan2(wheelGround(rocker.front) - wheelGround(rocker.rear), rocker.front.z - rocker.rear.z);
      const angle = THREE.MathUtils.clamp(Math.asin(forward.y) - slope, -MAX_ROCKER_ANGLE, MAX_ROCKER_ANGLE);
      rocker.group.rotation.x += (angle - rocker.group.rotation.x) * blend;
    }
    group.position.y += ((front + back + leftSide + rightSide) / 4 - group.position.y) * blend;
  }

  // Each wheel rolls at the speed of the ground passing under it, and the corner wheels point the way they travel
  function turnWheels(turnRate, delta) {
    for (const wheel of rover.wheels) {
      const sideways = wheel.steers ? turnRate * wheel.z : 0;
      const along = rover.speed - turnRate * wheel.x;
      let roll = Math.hypot(sideways, along);
      let angle = roll > MIN_WHEEL_SPEED ? Math.atan2(sideways, along) : 0;
      // A wheel never turns past sideways: it rolls backwards instead
      if (Math.abs(angle) > Math.PI / 2) {
        angle -= Math.sign(angle) * Math.PI;
        roll = -roll;
      }
      wheel.pivot.rotation.y += (angle - wheel.pivot.rotation.y) * (1 - Math.exp(-WHEEL_STEER_RATE * delta));
      wheel.spin.rotation.x += (roll * delta) / wheel.radius;
    }
  }

  function update(delta) {
    const throttle = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
    const steer = Number(keys.has('KeyA')) - Number(keys.has('KeyD'));
    const maxChange = ACCELERATION * delta;
    rover.speed += THREE.MathUtils.clamp(throttle * MAX_SPEED - rover.speed, -maxChange, maxChange);
    rover.heading += steer * TURN_SPEED * delta;
    turnWheels(steer * TURN_SPEED, delta);

    group.position.x += Math.sin(rover.heading) * rover.speed * delta;
    group.position.z += Math.cos(rover.heading) * rover.speed * delta;
    // Stay inside the ring of hills at the edge of the terrain
    const distance = Math.hypot(group.position.x, group.position.z);
    if (distance > DRIVE_RADIUS) {
      group.position.x *= DRIVE_RADIUS / distance;
      group.position.z *= DRIVE_RADIUS / distance;
    }
    settle(1 - Math.exp(-8 * delta));
  }

  settle(1);
  loadModel(rover, environment);
  scene.add(group);
  return rover;
}
