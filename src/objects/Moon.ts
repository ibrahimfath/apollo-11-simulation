import { CelestialBody } from "./CelestialBody";
import { Orbit } from "../physics/Orbit";

export class Moon extends CelestialBody {
  public orbit?: Orbit;

  constructor(earth: CelestialBody) {
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

    // Create orbit around Earth
    this.orbit = new Orbit(this, {
      centralBody: earth,
      orbitRadius: 384_400_000,           // m
      orbitPeriod: this.orbitPeriod,      // s
      inclination: 5.145                   // Moon's orbital inclination
    });
  }

  update(deltaTime: number) {
    super.update(deltaTime); // rotation
    if (this.orbit) {
      this.orbit.update(deltaTime); // orbital motion
    }
  }

}
