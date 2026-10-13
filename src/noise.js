function hash(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(min, max, x) {
  const t = Math.min(Math.max((x - min) / (max - min), 0), 1);
  return t * t * (3 - 2 * t);
}

// Value noise in the 0..1 range
export function noise2(x, y, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smoothstep(0, 1, x - xi);
  const v = smoothstep(0, 1, y - yi);
  return lerp(
    lerp(hash(xi, yi, seed), hash(xi + 1, yi, seed), u),
    lerp(hash(xi, yi + 1, seed), hash(xi + 1, yi + 1, seed), u),
    v
  );
}

// Fractal noise in the 0..1 range
export function fbm(x, y, octaves = 4, seed = 0) {
  let amplitude = 0.5;
  let frequency = 1;
  let sum = 0;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * frequency, y * frequency, seed + i) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return sum / total;
}

export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cheap 3D noise in the 0..1 range, built from two 2D lookups
export function noise3(x, y, z, seed = 0) {
  return (noise2(x + z * 0.71, y - z * 0.53, seed) + noise2(y + x * 0.37, z - x * 0.61, seed + 17)) * 0.5;
}

// Pushes each vertex in or out along its direction from the centre
export function displaceGeometry(geometry, amount, frequency, seed = 0) {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const scale = 1 + (noise3(x * frequency, y * frequency, z * frequency, seed) - 0.5) * 2 * amount;
    position.setXYZ(i, x * scale, y * scale, z * scale);
  }
  geometry.computeVertexNormals();
}
