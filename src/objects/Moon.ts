import * as THREE from "three";
import { OrbitTrail } from "../visualization/OrbitTrail";
import { CelestialBody } from "./CelestialBody";

export class Moon extends CelestialBody {
  public trail: OrbitTrail;

  constructor() {
    super({
      name: "Moon",
      mass: 7.34767309e22,                // kg
      radius: 1_737_400,                  // m
      baseRadius: 1_737_400,                  // m
      rotationPeriod: 24,  // s
      totalRotationPeriod: 27.32 * 24 * 3600,
      orbitPeriod: 27.32 * 24 * 3600,     // s
      axialTilt: 6.68,                    // degrees
      scalePerUnit: 1_000_000,                   // 1 unit = 1000 km
      textureMap: "/textures/moon/moonmap4k.jpg",
      bumpMap: "/textures/moon/moonbump4k.jpg",
    });
    this.trail = new OrbitTrail(0x837eb0, 50, 5000, 0.5);

  }
  
  update(deltaTime: number) {
    const rotationSpeed = (2 * Math.PI) / this.totalRotationPeriod; // rad/s
    this.mesh.rotation.y += rotationSpeed * deltaTime;
    
    const inv = 1 / 1_000_000;

    this.trail.addPoint(
      new THREE.Vector3(
        this.r_m.x * inv,
        this.r_m.y * inv,
        this.r_m.z * inv
      )
    ); 
  }

}
