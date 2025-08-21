import * as THREE from "three";

export interface StateRV {
  r: THREE.Vector3;
  v: THREE.Vector3;
  m: number;
}

/** One RK4 step for a 2nd-order system: r' = v, v' = a(r) */
export function rk4Step(
  state: StateRV,
  dt: number,
  accelAt: (r: THREE.Vector3, v: THREE.Vector3, m: number) => THREE.Vector3,
  massDot: (r: THREE.Vector3, v: THREE.Vector3, m: number) => number
): StateRV {
  // k1
  const k1_r = state.v.clone();
  const k1_v = accelAt(state.r, state.v, state.m);
  const k1_m = massDot(state.r, state.v, state.m);

  // k2 state
  const r2 = state.r.clone().addScaledVector(k1_r, 0.5 * dt);
  const v2 = state.v.clone().addScaledVector(k1_v, 0.5 * dt);
  const m2 = state.m + 0.5 * dt * k1_m;
  const k2_r = v2;
  const k2_v = accelAt(r2, v2, m2);
  const k2_m = massDot(r2, v2, m2);

  // k3 state
  const r3 = state.r.clone().addScaledVector(k2_r, 0.5 * dt);
  const v3 = state.v.clone().addScaledVector(k2_v, 0.5 * dt);
  const m3 = state.m + 0.5 * dt * k2_m;
  const k3_r = v3;
  const k3_v = accelAt(r3, v3, m3);
  const k3_m = massDot(r3, v3, m3);

  // k4 state
  const r4 = state.r.clone().addScaledVector(k3_r, dt);
  const v4 = state.v.clone().addScaledVector(k3_v, dt);
  const m4 = state.m + dt * k3_m;
  const k4_r = v4;
  const k4_v = accelAt(r4, v4, m4);
  const k4_m = massDot(r4, v4, m4);

  // combine
  const rNext = state.r.clone()
    .addScaledVector(k1_r, dt / 6)
    .addScaledVector(k2_r, dt / 3)
    .addScaledVector(k3_r, dt / 3)
    .addScaledVector(k4_r, dt / 6);

  const vNext = state.v.clone()
    .addScaledVector(k1_v, dt / 6)
    .addScaledVector(k2_v, dt / 3)
    .addScaledVector(k3_v, dt / 3)
    .addScaledVector(k4_v, dt / 6);

  const mNext = state.m + (dt / 6) * (k1_m + 2 * k2_m + 2 * k3_m + k4_m);

  return { r: rNext, v: vNext, m: mNext };
}
