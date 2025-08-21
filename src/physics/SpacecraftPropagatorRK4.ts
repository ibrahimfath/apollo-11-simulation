import * as THREE from "three";
import { Spacecraft } from "../objects/Spacecraft";
import { CelestialBody } from "../objects/CelestialBody";
import { gravityAccelAtPoint } from "./gravity";
import { rk4Step, type StateRV } from "./rk4";
import type { Atmosphere } from "../objects/Atmosphere";
import { computeDragAccel } from "./Drag";

export interface PropagatorProps {
  craft: Spacecraft,
  atmosphere: Atmosphere,
  dragParams?: { Cd?: number; area?: number },
  primaries: CelestialBody[], // e.g., [earth] or [earth, moon]
  eps: number  
}

export class SpacecraftPropagatorRK4 {
  public craft: Spacecraft;
  public atmosphere: Atmosphere;
  public dragParams?: { Cd?: number; area?: number }
  public primaries: CelestialBody[]; // e.g., [earth] or [earth, moon]
  public eps: number;
  
  constructor(props: PropagatorProps) {
    this.craft = props.craft;
    this.primaries = props.primaries;
    this.eps = props.eps ?? 0;

    this.atmosphere = props.atmosphere;
    this.dragParams = props.dragParams ?? { Cd: 2.2, area: 400 };
  }

  /** accelAt takes r (m), v (m/s), m (kg) and returns acceleration (m/s^2) */
  private accelAt = (r: THREE.Vector3, v: THREE.Vector3, m: number): THREE.Vector3 => {
    // gravity due to primaries
    const a = gravityAccelAtPoint(r, this.primaries, this.eps);

    // drag (use computeDragAccel which expects a craft-like object)
    if (this.atmosphere) {
      // Create a lightweight craft-like object for computeDragAccel
      const craftLike = {
        r_m: r,
        v_mps: v,
        mass: m,
        radius: this.craft.radius
      } as any;
      const drag = computeDragAccel(craftLike as any, this.atmosphere, this.dragParams);
      a.add(drag);
    }

    // thrust
    if (this.craft.engineOn && this.craft.throttle > 0 && m > 0) {
      const thrustForce = this.craft.getThrustVectorWorld(); // in N
      // acceleration contribution = F / m
      a.addScaledVector(thrustForce, 1 / m);
    }

    return a;
  };

  /** mass derivative (kg/s) */
  private massDot = (_r: THREE.Vector3, _v: THREE.Vector3, _m: number): number => {
    // negative if burning, 0 otherwise
    if (!this.craft.engineOn || this.craft.throttle <= 0) return 0;
    const mdot = this.craft.massFlowRate(); // already negative
    // but ensure we don't burn more than available (handled outside)
    return mdot;
  };

  /** Single step (non-adaptive) */
  step(dt: number) {
    const state: StateRV = { r: this.craft.r_m.clone(), v: this.craft.v_mps.clone(), m: this.craft.mass };
    const next = rk4Step(state, dt, this.accelAt, this.massDot);

    // Prevent negative mass: cap and recompute if necessary
    const mNext = Math.max(0, next.m);
    this.craft.fuelMass = Math.max(0, mNext - this.craft.dryMass);

    // If fuel exhausted, kill engines to avoid negative mass in future calls
    if (this.craft.fuelMass <= 0) {
      this.craft.engineOn = false;
      this.craft.throttle = 0;
    }

    this.craft.r_m.copy(next.r);
    this.craft.v_mps.copy(next.v);
    // store last acceleration estimate for GUI
    this.craft.a_mps2.copy(this.accelAt(this.craft.r_m, this.craft.v_mps, mNext));
    this.craft.syncVisualFromPhysics();
  }

  /** Adaptive substepper based on max acceleration & dv limit */
  stepWithAdaptive(dt: number, maxDt = 30, dvLimit = 5) {
    // estimate worst-case acceleration magnitude at current state
    const aNow = this.accelAt(this.craft.r_m, this.craft.v_mps, this.craft.mass);
    const aMag = aNow.length();

    // compute needed steps so that a*dt/steps <= dvLimit  => steps >= a*dt/dvLimit
    const estSteps = aMag * dt / Math.max(1e-8, dvLimit);
    const byMaxDt = Math.ceil(dt / maxDt);
    const steps = Math.max(1, Math.ceil(estSteps), byMaxDt);
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.step(h);
    }
  }

  /** old interface */
  stepWithSubsteps(dt: number, maxDt = 30) {
    this.stepWithAdaptive(dt, maxDt, 5); // dvLimit = 5 m/s default
  }
}
