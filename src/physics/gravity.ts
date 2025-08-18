import * as THREE from "three";
import { CelestialBody } from "../objects/CelestialBody";
import { G } from "./constants";

/** Acceleration at point r due to the provided massive bodies */
export function gravityAccelAtPoint(
  r: THREE.Vector3,
  primaries: CelestialBody[],
  eps: number = 0 // (m) softening to avoid singularities
): THREE.Vector3 {
  const a = new THREE.Vector3();
  for (const body of primaries) {
    const d = new THREE.Vector3().subVectors(body.r_m, r); // body - craft
    const r2 = d.lengthSq() + eps * eps;
    const invR = 1 / Math.sqrt(r2);
    const invR3 = invR * invR * invR;
    const factor = G * body.mass * invR3;
    a.addScaledVector(d, factor);
  }
  return a;
}
