import * as THREE from "three";
import vertexShader from "./shaders/atmosphere.vert.glsl";
import fragmentShader from "./shaders/atmosphere.frag.glsl";

interface AtmosphereParams {
  rimHex?: number;     // Rim scattering color
  facingHex?: number;  // Center-facing color
}

export function getAtmosphereMat({
  rimHex = 0x0088ff,
  facingHex = 0x000000
}: AtmosphereParams = {}): THREE.ShaderMaterial {

  const uniforms = {
    color1: { value: new THREE.Color(rimHex) },
    color2: { value: new THREE.Color(facingHex) },
    atmosphereBias: { value: 0.1 },
    atmosphereScale: { value: 0.27 },
    atmospherePower: { value: 5.0 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
}
