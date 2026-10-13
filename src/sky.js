import * as THREE from 'three';
import { DUST_COLOR, SUN_DIRECTION } from './constants.js';

const SKY_RADIUS = 900;
const FOG_DENSITY = 0.0065;

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 sunDirection;
  uniform vec3 zenithColor;
  uniform vec3 horizonColor;
  uniform vec3 haloColor;
  uniform vec3 glowColor;
  varying vec3 vWorldPosition;

  void main() {
    vec3 direction = normalize(vWorldPosition - cameraPosition);
    float height = max(direction.y, 0.0);
    float sunDot = max(dot(direction, sunDirection), 0.0);

    vec3 color = mix(horizonColor, zenithColor, pow(height, 0.45));
    // Warm dust halo, then the cool blue glow of a Martian sunset
    color = mix(color, haloColor, pow(sunDot, 4.0) * 0.55);
    color = mix(color, glowColor, pow(sunDot, 40.0) * 0.6);
    color += glowColor * pow(sunDot, 900.0) * 2.0;
    color += vec3(1.0, 0.96, 0.9) * smoothstep(0.99995, 0.99998, sunDot) * 8.0;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createSky(scene) {
  scene.fog = new THREE.FogExp2(DUST_COLOR, FOG_DENSITY);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(SKY_RADIUS, 48, 24),
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        sunDirection: { value: SUN_DIRECTION },
        zenithColor: { value: new THREE.Color(0x7d5236) },
        horizonColor: { value: new THREE.Color(DUST_COLOR) },
        haloColor: { value: new THREE.Color(0xf0c08a) },
        glowColor: { value: new THREE.Color(0xa9c4e0) },
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  scene.add(sky);
  return sky;
}
