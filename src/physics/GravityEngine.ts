import * as THREE from "three";
import { G } from "./constants";
import { CelestialBody } from "../objects/CelestialBody";


/**
 * GravityEngine: integrates mutual gravity among bodies using Velocity Verl et.
 * - bodies: array of CelestialBody (must have mass, r_m, v_mps)
 * - eps: softening length in meters (default 1e3)
 */
export class GravityEngine {
    public bodies: CelestialBody[];
    //for softening: (When two objects come very close, denominator |r|^3 blows up. Use a tiny softening ε)
    public eps: number;

    constructor(bodies: CelestialBody[], eps: number = 1e3) {
      this.bodies = bodies;
      this.eps = eps;
    }

    // compute accelerations (returns array of Vector3, same order as bodies)
    private computeAccelerations(positions: THREE.Vector3[]): THREE.Vector3[] {
        const n = this.bodies.length;
        const accs: THREE.Vector3[] = new Array(n);
        for (let i = 0; i < n; i++) accs[i] = new THREE.Vector3(0, 0, 0);

        for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const ri = positions[i];
            const rj = positions[j];
            const rij = new THREE.Vector3().subVectors(rj, ri); // rj - ri
            const dist2 = rij.lengthSq();
            const invDist3 = 1 / Math.pow(dist2 + this.eps * this.eps, 1.5);
            const factor = G * (this.bodies[j].mass) * invDist3;
            // acceleration on i due to j
            const a_on_i = rij.clone().multiplyScalar(factor);
            accs[i].add(a_on_i);
            // acceleration on j due to i (opposite)
            const factor_ji = G * (this.bodies[i].mass) * invDist3;
            const a_on_j = rij.clone().multiplyScalar(-factor_ji);
            accs[j].add(a_on_j);
        }
        
      }
        return accs;
    }

    /** One step with Velocity Verlet. dt in seconds */
    step(dt: number) {
      const n = this.bodies.length;
      if (n === 0 || dt <= 0) return;

      // 1) gather current positions
      const pos0 = this.bodies.map(b => b.r_m.clone());

      // 2) compute a0
      const a0 = this.computeAccelerations(pos0);

      // 3) r(t+dt) = r + v*dt + 0.5*a0*dt^2
      const pos1: THREE.Vector3[] = new Array(n);
      for (let i = 0; i < n; i++) {
        pos1[i] = pos0[i].clone()
          .addScaledVector(this.bodies[i].v_mps, dt)
          .addScaledVector(a0[i], 0.5 * dt * dt);
      }

      // 4) compute a1 using pos1
      const a1 = this.computeAccelerations(pos1);

      // 5) v(t+dt) = v + 0.5*(a0 + a1)*dt
      for (let i = 0; i < n; i++) {
        this.bodies[i].v_mps.addScaledVector(a0[i].clone().add(a1[i]).multiplyScalar(0.5), dt);
        this.bodies[i].r_m.copy(pos1[i]); // accept new position
        this.bodies[i].a_mps2.copy(a1[i]); //accept new acceleration
      }

      // 6) sync visuals
      for (const b of this.bodies) b.syncVisualFromPhysics();
    }

    /** Step with sub-steps to keep dt small for stability */
    stepWithSubsteps(dt: number, maxDt = 60) {
      // If dt > maxDt, split into N steps
      const steps = Math.max(1, Math.ceil(dt / maxDt));
      const smallDt = dt / steps;
      for (let i = 0; i < steps; i++) this.step(smallDt);
    }
}