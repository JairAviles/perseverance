import * as THREE from 'three';
import { CAMERAS } from './photos.js';

const POINT_SIZE = 0.14;
const POINT_COLOR = 0x9fe8ff;
const PULSE_SPEED = 3;
// How close the pointer must be to a point, in pixels
const HIT_RADIUS = 16;
const CLICK_TOLERANCE = 5;

function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// Glowing points on the rover's cameras: hover shows the name, click takes a photo
export function createCameraPoints(rover, camera, element, onShoot) {
  const points = [];
  const label = document.createElement('div');
  label.className = 'camera-label';
  label.hidden = true;
  document.body.appendChild(label);

  const texture = createGlowTexture();
  const world = new THREE.Vector3();
  const box = new THREE.Box3();
  const pointer = { x: 0, y: 0, downX: 0, downY: 0 };
  let hovered = null;

  function addPoints() {
    for (const config of CAMERAS) {
      const part = rover.group.getObjectByName(config.part);
      if (!part) continue;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, color: POINT_COLOR, blending: THREE.AdditiveBlending, depthTest: false, transparent: true })
      );
      // Sits on the middle of the part and rides along with it
      box.setFromObject(part).getCenter(world);
      sprite.position.copy(part.worldToLocal(world));
      sprite.scale.setScalar(POINT_SIZE / part.getWorldScale(world).x);
      sprite.renderOrder = 10;
      part.add(sprite);
      points.push({ config, sprite });
    }
  }

  function getScreenPosition(point) {
    point.sprite.getWorldPosition(world).project(camera);
    return { x: ((world.x + 1) / 2) * window.innerWidth, y: ((1 - world.y) / 2) * window.innerHeight, visible: world.z < 1 };
  }

  function findPoint(x, y) {
    let closest = null;
    let closestDistance = HIT_RADIUS;
    for (const point of points) {
      const screen = getScreenPosition(point);
      const distance = Math.hypot(screen.x - x, screen.y - y);
      if (screen.visible && distance < closestDistance) {
        closest = point;
        closestDistance = distance;
      }
    }
    return closest;
  }

  // The photo now covers the point, so nothing stays hovered
  function forgetPointer() {
    pointer.x = -1000;
    pointer.y = -1000;
  }

  element.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  element.addEventListener('pointerdown', (event) => {
    pointer.downX = event.clientX;
    pointer.downY = event.clientY;
  });
  // A click, not the end of a camera drag
  element.addEventListener('pointerup', (event) => {
    if (Math.hypot(event.clientX - pointer.downX, event.clientY - pointer.downY) > CLICK_TOLERANCE) return;
    const point = findPoint(event.clientX, event.clientY);
    if (!point) return;
    forgetPointer();
    onShoot(point.config);
  });
  element.addEventListener('pointerleave', forgetPointer);

  window.__cameraScreenPosition = (key) => {
    const point = points.find((candidate) => candidate.config.key === key);
    return point ? getScreenPosition(point) : null;
  };

  function update(time) {
    if (!points.length && rover.ready) addPoints();
    const pulse = 0.75 + 0.25 * Math.sin(time * PULSE_SPEED);
    points.forEach((point) => (point.sprite.material.opacity = point === hovered ? 1 : pulse));

    hovered = findPoint(pointer.x, pointer.y);
    element.style.cursor = hovered ? 'pointer' : '';
    label.hidden = !hovered;
    if (hovered) {
      label.textContent = hovered.config.name;
      label.style.transform = `translate(${pointer.x + 14}px, ${pointer.y - 28}px)`;
    }
  }

  return { points, update };
}
