import * as THREE from "three";
import { Atmosphere } from "./atmosphere";
import { CelestialBody } from "./CelestialBody";
import { markForBloom } from "./bloom";

export class Earth extends CelestialBody {

  public atmosphere: Atmosphere;

  constructor() {
    super({
      name: "Earth",
      mass: 5.972e24,                     // kg
      radius: 6_371_000,                  // m
      baseRadius: 6_371_000,              // m
      rotationPeriod: 23.93,       // s
      totalRotationPeriod: 23.93 * 3600,  // s
      orbitPeriod: 365.25 * 24 * 3600,    // s
      axialTilt: 23.4,                    // degrees
      scalePerUnit: 1_000_000,                   // 1 unit = 1000 km
      textureMap: "/textures/earth/8k_earth_daymap.jpg",
      specularMap: "/textures/earth/8k_earth_specular_map.jpg",
      cloudsMap: "/textures/earth/8k_earth_clouds.jpg",
    });
    this.atmosphere = new Atmosphere();

    this.atmosphere.mesh = new THREE.Mesh(this.geometry, this.atmosphere.material);
    this.atmosphere.mesh.scale.setScalar(1.01);
    markForBloom(this.atmosphere.mesh); // glow effect
    this.group.add(this.atmosphere.mesh);
  }
  
  
}
