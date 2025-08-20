import * as THREE from "three";
import { Spacecraft } from "../objects/Spacecraft";
import { CelestialBody } from "../objects/CelestialBody";
import { gravityAccelAtPoint } from "./gravity";
import { rk4Step } from "./rk4";
import type { Atmosphere } from "../objects/Atmosphere";

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

  step(dt: number) {
    const accelAt = (r: THREE.Vector3, v: THREE.Vector3) => {
    // Gravity
    const a = gravityAccelAtPoint(r, this.primaries, this.eps);

    // Drag (only if atmosphere present)
    if (this.atmosphere) {
      const earth = this.primaries[0];
      const altitude = r.distanceTo(earth.r_m) - earth.radius;
      const rho = this.atmosphere.densityAtAltitude(altitude);
      // crude: assume first primary = Earth
      const Cd = this.dragParams?.Cd ?? 2.2;
      const A = this.dragParams?.area ?? Math.PI * this.craft.radius ** 2;
      const vMag = v.length();
      if (vMag > 0) {
        const dragMag = -0.5 * rho * Cd * A * vMag * vMag / this.craft.mass;
        a.addScaledVector(v.clone().normalize(), dragMag);
      }
    }
    return a;
    };

    const next = rk4Step({ r: this.craft.r_m, v: this.craft.v_mps }, dt, accelAt);


    this.craft.r_m.copy(next.r);
    this.craft.v_mps.copy(next.v);
    this.craft.a_mps2.copy(accelAt(this.craft.r_m, this.craft.v_mps));
    this.craft.syncVisualFromPhysics();
  }

  stepWithSubsteps(dt: number, maxDt = 30) {
    const steps = Math.max(1, Math.ceil(dt / maxDt));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.step(h);
  }
}
