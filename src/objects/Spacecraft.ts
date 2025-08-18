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
    this.mesh.position.set(0, 0, 8);
    markForBloom(this.mesh);
    this.group.add(this.mesh);

  }

  /** wet mass: dry + fuel */
  public get mass(): number {
    return this.dryMass + this.fuelMass;
  }

}
