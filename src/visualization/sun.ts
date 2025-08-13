import * as THREE from "three";
import { markForBloom } from "./bloom";

export function createSun(): THREE.Mesh {

  const detail = 12;

  const geometry = new THREE.IcosahedronGeometry(4, detail);
  const material = new THREE.MeshBasicMaterial({ color: "#FDB813" })
  const sun = new THREE.Mesh(geometry, material);

  sun.position.set(0, 0, 100);
  markForBloom(sun); // Sun glows
  return sun
}

