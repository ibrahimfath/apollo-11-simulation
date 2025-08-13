import * as THREE from "three";

export function createScene() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance", // hint to GPU
  });

  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // High-DPI fix

  // Enable physically-based rendering
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Correct output color space
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Shadows (optional, but useful for spacecraft/Moon shading)
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

  return { scene, camera, renderer };
}
