import * as THREE from "three";
import vertexShader from "../visualization/shaders/atmosphere.vert.glsl";
import fragmentShader from "../visualization/shaders/atmosphere.frag.glsl";
import { markForBloom } from "../visualization/bloom";


export interface AtmoOptions {
  geometry?: THREE.IcosahedronGeometry;
  earthRadius?: number;  // m
  rho0?: number;         // kg/m^3 at 120 km
  H?: number;            // m (scale height)
  hBase?: number;        // m (layer base)
  hCutoff?: number;      // m (no drag above)
}

export class Atmosphere {
  public earthRadius: number;
  public rho0: number;
  public H: number;
  public hBase: number;
  public hCutoff: number;

  public material?: THREE.ShaderMaterial;
  public mesh: THREE.Mesh;
  public rimHex?: number;     // Rim scattering color
  public facingHex?: number;  // Center-facing color
  public bias?: number;
  public scale?: number;
  public power?: number;
  public baseRadius?: number

  constructor(opts: AtmoOptions) {
    this.rimHex = 0x0088ff;
    this.facingHex = 0x000000;
    this.bias = 0.1;
    this.scale = 0.5;
    this.power = 5.0;

    const uniforms = {
      color1: { value: new THREE.Color(this.rimHex) },
      color2: { value: new THREE.Color(this.facingHex) },
      atmosphereBias: { value: this.bias },
      atmosphereScale: { value: this.scale },
      atmospherePower: { value: this.power},
    };

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.mesh = new THREE.Mesh(opts.geometry, this.material);
    this.mesh.scale.setScalar(1.01);
    markForBloom(this.mesh);

    // for physics:
    this.earthRadius = opts.earthRadius ?? 6_371_000;
    this.rho0 = opts.rho0 ?? 2.0e-9;      // density ~ at 120 km
    this.H    = opts.H    ?? 60_000;      // 60 km scale height
    this.hBase = opts.hBase ?? 120_000;   // start of thermosphere
    this.hCutoff = opts.hCutoff ?? 1_000_000; // 1000 km cutoff
  }

  /** Altitude above mean radius (meters). */
  altitudeFromPosition(r: THREE.Vector3): number {
    return r.length() - this.earthRadius;
  }

  /** Exponential density above hBase, 0 below surface, 0 above cutoff. */
  densityAtAltitude(h: number): number {
    if (h <= 0) return this.rho0;       // treat near-surface as max of this layer
    if (h >= this.hCutoff) return 0;
    if (h < this.hBase) return this.rho0;  // flat until base (keeps it simple)
    const dh = h - this.hBase;
    return this.rho0 * Math.exp(-dh / this.H);
  }

  
}
