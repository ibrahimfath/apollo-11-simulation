import * as THREE from "three";

export function unit(v: THREE.Vector3): THREE.Vector3 {
  return v.clone().normalize();
}
export function prograde(r: THREE.Vector3, v: THREE.Vector3) { return unit(v); }
export function retrograde(r: THREE.Vector3, v: THREE.Vector3) { return unit(v).multiplyScalar(-1); }
export function radialOut(r: THREE.Vector3) { return unit(r); }
export function radialIn(r: THREE.Vector3) { return unit(r).multiplyScalar(-1); }
export function normal(r: THREE.Vector3, v: THREE.Vector3) {
  const h = new THREE.Vector3().crossVectors(r, v);
  return unit(h);
}
export function antiNormal(r: THREE.Vector3, v: THREE.Vector3) {
  return normal(r, v).multiplyScalar(-1);
}
