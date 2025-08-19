import * as THREE from "three";
import { Atmosphere } from "../objects/Atmosphere"; 
import type { Spacecraft } from "../objects/Spacecraft";

export interface DragParams {
  Cd?: number;     // drag coefficient
  area?: number;   // cross-section m^2
}

export function computeDragAccel(
  craft: Spacecraft,
  atmo: Atmosphere,
  params: DragParams = {}
): THREE.Vector3 {
  const Cd = params.Cd ?? 2.2;
  const A  = params.area ?? 10;     // pick your craft’s projected area
  const m  = craft.mass;

  // altitude & density
  const h = atmo.altitudeFromPosition(craft.r_m);
  const rho = atmo.densityAtAltitude(h);
  if (rho <= 0 || m <= 0) return new THREE.Vector3();

  // relative wind: start with craft velocity; add rotation later if desired
  const vRel = craft.v_mps.clone(); // minus (omega x r) later
  const speed = vRel.length();
  if (speed < 1e-6) return new THREE.Vector3();

  // a_drag = -0.5 * (Cd*A/m) * rho * |v| * v
  const coeff = -0.5 * (Cd * A / m) * rho * speed;
  return vRel.multiplyScalar(coeff);
}
