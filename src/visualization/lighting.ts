import * as THREE from "three";

export function createSunLight(): THREE.DirectionalLight {
  const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
  sunLight.position.set(0, 0, 130);
  return sunLight;
}
