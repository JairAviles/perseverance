import * as THREE from 'three';

const WHEEL_PART = 'Wheels_objs';
const SUSPENSION_PART = 'suspension';
const WHEEL_ROWS = 3;
// A light coat of dust so the treads and spokes read against the ground
const WHEEL_DUST_COLOR = new THREE.Color(0x9a6a4a);
const WHEEL_DUST_AMOUNT = 0.35;
const WHEEL_ROUGHNESS = 0.65;
// Suspension pieces that sit this close to a corner wheel's axis steer with it (model units)
const STEER_PART_REACH = 0.34;
// Pieces further than this from the centreline belong to that side's rocker
const ROCKER_MIN_OFFSET = 0.7;
const ROCKER_PIVOT_HEIGHT = 0.75;
const WELD_PRECISION = 1e4;

function pickVertices(geometry, vertices) {
  const picked = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const { itemSize } = attribute;
    const array = new attribute.array.constructor(vertices.length * itemSize);
    vertices.forEach((vertex, i) => {
      for (let k = 0; k < itemSize; k++) array[i * itemSize + k] = attribute.array[vertex * itemSize + k];
    });
    picked.setAttribute(name, new THREE.BufferAttribute(array, itemSize, attribute.normalized));
  }
  return picked;
}

function getMeshes(object) {
  const meshes = [];
  object.traverse((child) => child.isMesh && meshes.push(child));
  return meshes;
}

// Groups triangles into separate solid pieces by joining the ones that share a corner
function findPieces(geometry) {
  const position = geometry.attributes.position;
  const parent = Array.from({ length: position.count }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const seen = new Map();
  for (let i = 0; i < position.count; i++) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)].map((value) => Math.round(value * WELD_PRECISION)).join();
    if (seen.has(key)) parent[find(i)] = find(seen.get(key));
    else seen.set(key, i);
    if (i % 3) parent[find(i)] = find(i - 1);
  }

  const pieces = new Map();
  const point = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    const root = find(i);
    if (!pieces.has(root)) pieces.set(root, { vertices: [], box: new THREE.Box3() });
    pieces.get(root).vertices.push(i);
    pieces.get(root).box.expandByPoint(point.fromBufferAttribute(position, i));
  }
  return [...pieces.values()];
}

// The model's six wheels are a single object; this cuts it into six that each turn on their own axle
function splitWheels(wheelsObject) {
  const meshes = getMeshes(wheelsObject);
  const bounds = new THREE.Box3();
  meshes.forEach((mesh) => {
    mesh.geometry.computeBoundingBox();
    bounds.union(mesh.geometry.boundingBox);
  });
  const rowLength = (bounds.max.z - bounds.min.z) / WHEEL_ROWS;

  // Left side first, each side ordered rear to front
  const wheels = Array.from({ length: WHEEL_ROWS * 2 }, () => ({ parts: [], box: new THREE.Box3() }));
  for (const mesh of meshes) {
    const geometry = mesh.geometry.toNonIndexed();
    const position = geometry.attributes.position;
    const vertices = wheels.map(() => []);
    for (let i = 0; i < position.count; i += 3) {
      const x = (position.getX(i) + position.getX(i + 1) + position.getX(i + 2)) / 3;
      const z = (position.getZ(i) + position.getZ(i + 1) + position.getZ(i + 2)) / 3;
      const row = Math.min(Math.floor((z - bounds.min.z) / rowLength), WHEEL_ROWS - 1);
      vertices[(x > 0 ? 0 : WHEEL_ROWS) + row].push(i, i + 1, i + 2);
    }

    const material = mesh.material.clone();
    material.color.lerp(WHEEL_DUST_COLOR, WHEEL_DUST_AMOUNT);
    material.roughness = WHEEL_ROUGHNESS;
    wheels.forEach((wheel, i) => {
      const part = new THREE.Mesh(pickVertices(geometry, vertices[i]), material);
      part.geometry.computeBoundingBox();
      wheel.box.union(part.geometry.boundingBox);
      wheel.parts.push(part);
    });
    mesh.removeFromParent();
    mesh.geometry.dispose();
  }

  return wheels.map(({ parts, box }, i) => {
    const axle = box.getCenter(new THREE.Vector3());
    // The pivot steers the wheel and the spin group rolls it
    const pivot = new THREE.Group();
    const spin = new THREE.Group();
    parts.forEach((part) => {
      part.geometry.translate(-axle.x, -axle.y, -axle.z);
      spin.add(part);
    });
    pivot.add(spin);
    pivot.position.copy(axle).add(wheelsObject.position);
    return { pivot, spin, radius: (box.max.y - box.min.y) / 2, steers: i % WHEEL_ROWS !== 1 };
  });
}

// Hangs each side's wheels and suspension arms from a rocker that can tip, and moves the
// steering posts onto their wheels, leaving only the centre pieces fixed to the body
function splitSuspension(suspensionObject, wheels) {
  const offset = suspensionObject.position;
  const rockers = [0, 1].map((side) => {
    const sideWheels = wheels.slice(side * WHEEL_ROWS, (side + 1) * WHEEL_ROWS);
    const group = new THREE.Group();
    const parts = new THREE.Group();
    group.position.set(0, ROCKER_PIVOT_HEIGHT, (sideWheels[1].pivot.position.z + sideWheels[2].pivot.position.z) / 2);
    parts.position.copy(group.position).negate();
    parts.add(...sideWheels.map((wheel) => wheel.pivot));
    group.add(parts);
    return { group, parts, rear: sideWheels[0], front: sideWheels[2] };
  });

  const pivots = wheels.map((wheel) => wheel.pivot);
  const box = new THREE.Box3();
  for (const mesh of getMeshes(suspensionObject)) {
    const geometry = mesh.geometry.toNonIndexed();
    const owners = new Map();
    for (const piece of findPieces(geometry)) {
      box.copy(piece.box).translate(offset);
      const wheel = wheels.find(
        ({ steers, pivot }) =>
          steers &&
          box.min.x > pivot.position.x - STEER_PART_REACH &&
          box.max.x < pivot.position.x + STEER_PART_REACH &&
          box.min.z > pivot.position.z - STEER_PART_REACH &&
          box.max.z < pivot.position.z + STEER_PART_REACH
      );
      const x = (box.min.x + box.max.x) / 2;
      const owner = wheel?.pivot ?? (Math.abs(x) > ROCKER_MIN_OFFSET ? rockers[x > 0 ? 0 : 1].parts : suspensionObject);
      if (!owners.has(owner)) owners.set(owner, []);
      owners.get(owner).push(...piece.vertices);
    }

    for (const [owner, vertices] of owners) {
      const part = new THREE.Mesh(pickVertices(geometry, vertices), mesh.material);
      // Rockers sit in the model's space, not the suspension's, and wheel pivots at their own axle
      if (owner !== suspensionObject) part.position.copy(offset);
      if (pivots.includes(owner)) part.position.sub(owner.position);
      owner.add(part);
    }
    mesh.removeFromParent();
    mesh.geometry.dispose();
  }
  return rockers;
}

// Returns the wheels and rockers with their sizes in metres: x left, z forward of the rover's centre
export function createWheels(model) {
  const wheelsObject = model.getObjectByName(WHEEL_PART);
  const suspensionObject = model.getObjectByName(SUSPENSION_PART);
  if (!wheelsObject || !suspensionObject) return { wheels: [], rockers: [] };

  const scale = model.scale.x;
  const wheels = splitWheels(wheelsObject);
  const rockers = splitSuspension(suspensionObject, wheels);
  model.add(...rockers.map((rocker) => rocker.group));
  wheels.forEach((wheel) => {
    wheel.x = wheel.pivot.position.x * scale;
    wheel.z = wheel.pivot.position.z * scale;
    wheel.radius *= scale;
  });
  return { wheels, rockers };
}
