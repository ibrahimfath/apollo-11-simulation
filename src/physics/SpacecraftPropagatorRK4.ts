import * as THREE from "three";
import { Spacecraft } from "../objects/Spacecraft";
import { CelestialBody } from "../objects/CelestialBody";
import { gravityAccelAtPoint } from "./gravity";
import { rk4Step } from "./rk4";

export interface PropagatorProps {
  craft: Spacecraft,
  primaries: CelestialBody[], // e.g., [earth] or [earth, moon]
  eps: number  
}

export class SpacecraftPropagatorRK4 {
  public craft: Spacecraft;
  public primaries: CelestialBody[]; // e.g., [earth] or [earth, moon]
  public eps: number;
  
  constructor(props: PropagatorProps) {
    this.craft = props.craft;
    this.primaries = props.primaries;
    this.eps = props.eps ?? 0;
  }

  step(dt: number) {
    const accelAt = (r: THREE.Vector3) => gravityAccelAtPoint(r, this.primaries, this.eps);
    const next = rk4Step({ r: this.craft.r_m, v: this.craft.v_mps }, dt, accelAt);

    this.craft.r_m.copy(next.r);
    this.craft.v_mps.copy(next.v);
    this.craft.a_mps2.copy(accelAt(this.craft.r_m)); // for GUI display
    this.craft.syncVisualFromPhysics();
  }

  stepWithSubsteps(dt: number, maxDt = 30) {
    const steps = Math.max(1, Math.ceil(dt / maxDt));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.step(h);
  }
}
