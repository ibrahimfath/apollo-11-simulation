// src/physics/Barycenter.ts
import * as THREE from "three";
import { CelestialBody } from "../objects/CelestialBody";

export class Barycenter {
  public bodies: [CelestialBody, CelestialBody];
  public rB_m = new THREE.Vector3();      // barycenter (meters)
  public marker: THREE.Mesh;              // visual marker
  public visible = true;

  constructor(a: CelestialBody, b: CelestialBody) {
    this.bodies = [a, b];

    // small neutral marker (scene units)
    const geo = new THREE.SphereGeometry(0.05, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    this.marker = new THREE.Mesh(geo, mat);
    this.marker.name = "BarycenterMarker";
    this.marker.layers.enableAll(); // visible to bloom too if you like; or remove this
  }

  /** Recompute barycenter from current body states and move the marker. */
  update() {
    const [a, b] = this.bodies;
    const mA = a.mass;
    const mB = b.mass;
    const M  = mA + mB;

    // rB = (mA rA + mB rB) / (mA + mB)
    this.rB_m
      .copy(a.r_m).multiplyScalar(mA)
      .addScaledVector(b.r_m, mB)
      .multiplyScalar(1 / M);

    // move marker (meters -> scene units)
    const invScale = 1 / a.scalePerUnit; // assume both use same scale
    this.marker.position.set(
      this.rB_m.x * invScale,
      this.rB_m.y * invScale,
      this.rB_m.z * invScale
    );

    this.marker.visible = this.visible;
  }

  /** Distance (meters) from body to barycenter */
  distanceFrom(body: CelestialBody): number {
    return body.r_m.distanceTo(this.rB_m);
  }
}
