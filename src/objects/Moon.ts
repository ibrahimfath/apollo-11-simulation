import { CelestialBody } from "./CelestialBody";

export class Moon extends CelestialBody {

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
  }
  

}
