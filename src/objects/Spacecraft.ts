import * as THREE from "three";
import { markForBloom } from "../visualization/bloom";
import { OrbitTrail } from "../visualization/OrbitTrail";
import { g0 } from "../physics/constants";

export interface SpacecraftProps {
  scalePerUnit?: number;
  dryMass?: number;
  fuelMass?: number;
  radius?: number;
  color?: number | string;
}

export class Spacecraft {
  public group: THREE.Group;
  public mesh: THREE.Mesh;
  public trail: OrbitTrail;
  

  public dryMass: number;    // kg (structure + payload)
  public fuelMass: number;   // kg (remaining propellant)
  public radius: number;     // meters (visual/scalar reference)
  public baseRadius: number;
  public scalePerUnit: number;

  // Physics state (SI)
  public r_m = new THREE.Vector3();    // position (m)
  public v_mps = new THREE.Vector3();  // velocity (m/s)
  public a_mps2 = new THREE.Vector3(); // acceleration (m/s^2) – for display

  //engine:
  public isp_s: number;       // specific impulse (s)
  public T_max_N: number;      // maximum engine thrust (N)
  public throttle: number;     // 0..1
  public engineOn: boolean;
  public thrustDirection_world: THREE.Vector3 | null; // unit vector; null = use velocity direction (prograde)


  constructor(props: SpacecraftProps) {
    this.scalePerUnit = 1_000_000;
    this.dryMass = props.dryMass ?? 13_000; // kg
    this.fuelMass = props.fuelMass ?? 120_000; // kg
    this.radius = props.radius ?? 10000; // meters (visual)
    this.baseRadius = this.radius;
    const scaledRadius = this.radius / this.scalePerUnit;

    this.group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(scaledRadius, 16, 12);
    const material = new THREE.MeshStandardMaterial({ color: props.color ?? 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    markForBloom(this.mesh);
    this.group.add(this.mesh);

    this.trail = new OrbitTrail(0x00ffcc, 50, 5000, 0.01);

    this.isp_s = 320;         // e.g., ~320 s (placeholder)
    this.T_max_N = 0; // default 0 (engines off). Set to a real value when you add engines.
    this.throttle = 0;
    this.engineOn = false;
    this.thrustDirection_world = null; // if null use prograde (v) as default when engineOn



  }

  setRadius(newRadius: number) {
    const scaleFactor = newRadius / this.baseRadius;
    this.radius = newRadius;
    this.group.scale.setScalar(scaleFactor);
  }

  /** wet mass: dry + fuel */
  public get mass(): number {
    return this.dryMass + this.fuelMass;
  }

  setInitialState(positionMeters: THREE.Vector3, velocityMps: THREE.Vector3) {
    this.r_m.copy(positionMeters);
    this.v_mps.copy(velocityMps);
    this.syncVisualFromPhysics();
  }

  syncVisualFromPhysics() {
    const inv = 1 / this.scalePerUnit;
    this.group.position.set(this.r_m.x * inv, this.r_m.y * inv, this.r_m.z * inv);

    // Simple “point in velocity direction” visual
    if (this.v_mps.lengthSq() > 1e-6) {
      const fwd = this.v_mps.clone().normalize();
      this.mesh.lookAt(this.group.position.clone().add(fwd));
    }
  }

  update() {
    const inv = 1 / 1_000_000;
    this.trail.addPoint(
      new THREE.Vector3(
        this.r_m.x * inv,
        this.r_m.y * inv,
        this.r_m.z * inv
      )
    ); 
  }
  
  // --- Impulsive Δv helper (world-frame) ---
  /**
   * Apply an instantaneous delta-v in WORLD coordinates.
   * Reduces fuel using the rocket equation. If fuel is limited,
   * it applies the largest dv the remaining propellant affords.
   */
  public applyDeltaV(dvWorld: THREE.Vector3, IspOverride?: number) {
    const dv = dvWorld.length();
    if (dv <= 0) return;

    const Isp = IspOverride ?? this.isp_s;
    const m0 = this.mass;
    if (m0 <= 0 || this.fuelMass <= 0) return;

    // Fuel needed for the requested dv
    // dm = m0 - m1, where dv = Isp*g0*ln(m0/m1)
    const dmNeeded = m0 - m0 / Math.exp(dv / (Isp * g0));

    // Cap by available fuel
    const dm = Math.min(this.fuelMass, dmNeeded);
    if (dm <= 0) return;

    // Effective dv if fuel limited
    const dvEff = Isp * g0 * Math.log(m0 / (m0 - dm));

    const dir = dvWorld.clone().normalize();
    this.v_mps.addScaledVector(dir, dvEff);
    this.fuelMass -= dm; // burn the propellant
  }

  // call to compute thrust vector in world frame
  public getThrustVectorWorld(): THREE.Vector3 {
    if (!this.engineOn || this.throttle <= 0 || this.T_max_N <= 0) return new THREE.Vector3(); 
    const T = this.T_max_N * this.throttle;
    // direction:
    let dir = new THREE.Vector3();
    if (this.thrustDirection_world && this.thrustDirection_world.lengthSq() > 1e-9) {
      dir.copy(this.thrustDirection_world).normalize();
    } else {
      // fallback to prograde (if velocity small, use radial out)
      if (this.v_mps.lengthSq() > 1e-9) {
        dir.copy(this.v_mps).normalize();
      } else {
        dir.copy(this.r_m).normalize();
      }
    }
    return dir.multiplyScalar(T);
  }

  // helper: mass flow rate given current throttle
  public massFlowRate(): number {
    if (!this.engineOn || this.throttle <= 0 || this.isp_s <= 0) return 0;
    const T = this.T_max_N * this.throttle;
    return -T / (this.isp_s * g0); // dm/dt (negative)
  }

}
