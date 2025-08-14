import { CelestialBody } from "../visualization/CelestialBody";

export interface OrbitParams {
  centralBody: CelestialBody; // The body being orbited (e.g., Earth)
  orbitRadius: number;        // meters
  orbitPeriod: number;        // seconds
  inclination?: number;       // degrees
  scale?: number;              // meters per Three.js unit
}

export class Orbit {
  private object: CelestialBody;
  private center: CelestialBody;
  public orbitRadius: number; // in scene units
  public orbitPeriod: number; // seconds
  public inclination: number; // radians
  private elapsedTime: number = 0;

  constructor(object: CelestialBody, params: OrbitParams) {
    this.object = object;
    this.center = params.centralBody;
    this.orbitPeriod = params.orbitPeriod;
    this.inclination = (params.inclination ?? 0) * Math.PI / 180;
    const scale = params.scale ?? object.scalePerUnit;
    this.orbitRadius = params.orbitRadius / scale;
  }

  update(deltaTime: number) {
    this.elapsedTime += deltaTime;
    const angle = (2 * Math.PI * this.elapsedTime) / this.orbitPeriod;

    const x = this.orbitRadius * Math.cos(angle);
    const z = this.orbitRadius * Math.sin(angle);
    const y = this.orbitRadius * Math.sin(this.inclination);

    this.object.group.position.set(
      this.center.group.position.x + x,
      this.center.group.position.y + y,
      this.center.group.position.z + z
    );
  }
}
