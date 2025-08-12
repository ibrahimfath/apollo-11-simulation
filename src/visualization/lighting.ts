import * as THREE from "three";

export function createSunLight(): THREE.DirectionalLight {
  const sunLight = new THREE.DirectionalLight(0xffffff, 4.0);
  sunLight.position.set(-2, 0.5, 1.5);
  return sunLight;
}
