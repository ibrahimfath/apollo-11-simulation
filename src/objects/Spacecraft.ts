import * as THREE from "three";
import { markForBloom } from "../visualization/bloom";

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

  public dryMass: number;    // kg (structure + payload)
  public fuelMass: number;   // kg (remaining propellant)
  public radius: number;     // meters (visual/scalar reference)
  public scalePerUnit: number;

  // Physics state (SI)
  public r_m = new THREE.Vector3();    // position (m)
  public v_mps = new THREE.Vector3();  // velocity (m/s)
  public a_mps2 = new THREE.Vector3(); // acceleration (m/s^2) – for display


  constructor(props: SpacecraftProps) {
    this.scalePerUnit = 1_000_000;
    this.dryMass = props.dryMass ?? 13_000; // kg
    this.fuelMass = props.fuelMass ?? 120_000; // kg
    this.radius = props.radius ?? 10000; // meters (visual)
    const scaledRadius = this.radius / this.scalePerUnit;

    this.group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(scaledRadius, 16, 12);
    const material = new THREE.MeshStandardMaterial({ color: props.color ?? 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    markForBloom(this.mesh);
    this.group.add(this.mesh);

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
  

}
