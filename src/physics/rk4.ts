import * as THREE from "three";

export interface StateRV {
  r: THREE.Vector3;
  v: THREE.Vector3;
}

/** One RK4 step for a 2nd-order system: r' = v, v' = a(r) */
export function rk4Step(
  state: StateRV,
  dt: number,
  accelAt: (r: THREE.Vector3, v: THREE.Vector3) => THREE.Vector3
): StateRV {
  // k1
  const k1_r = state.v.clone();
  const k1_v = accelAt(state.r, state.v);

  // k2
  const r2 = state.r.clone().addScaledVector(k1_r, dt * 0.5);
  const v2 = state.v.clone().addScaledVector(k1_v, dt * 0.5);
  const k2_r = v2;
  const k2_v = accelAt(r2, v2);

  // k3
  const r3 = state.r.clone().addScaledVector(k2_r, dt * 0.5);
  const v3 = state.v.clone().addScaledVector(k2_v, dt * 0.5);
  const k3_r = v3;
  const k3_v = accelAt(r3, v3);

  // k4
  const r4 = state.r.clone().addScaledVector(k3_r, dt);
  const v4 = state.v.clone().addScaledVector(k3_v, dt);
  const k4_r = v4;
  const k4_v = accelAt(r4, v4);

  // combine
  const rNext = state.r.clone().addScaledVector(k1_r, dt / 6)
    .addScaledVector(k2_r, dt / 3)
    .addScaledVector(k3_r, dt / 3)
    .addScaledVector(k4_r, dt / 6);

  const vNext = state.v.clone().addScaledVector(k1_v, dt / 6)
    .addScaledVector(k2_v, dt / 3)
    .addScaledVector(k3_v, dt / 3)
    .addScaledVector(k4_v, dt / 6);

  return { r: rNext, v: vNext };
}
