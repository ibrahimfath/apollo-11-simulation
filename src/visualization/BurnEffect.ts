import * as THREE from "three";
import { markForBloom } from "./bloom"; // adjust path if needed

export interface BurnEffectOptions {
  coneColor?: number;      // core color
  glowColor?: number;      // outer glow
  coneLengthKm?: number;   // km
  coneRadiusKm?: number;   // km at base
  particleCount?: number;
  particleSpreadKm?: number;
  lightColor?: number;
  lightIntensity?: number;
}

export class BurnEffect {
  public group: THREE.Group;
  private cone: THREE.Mesh;
  private glow: THREE.Mesh;       // soft outer mesh

  private opts: Required<BurnEffectOptions>;

  constructor(opts?: BurnEffectOptions) {
    this.opts = Object.assign({
      coneColor: 0xff8a33,
      glowColor: 0xffd27a,
      coneLengthKm: 5, // 5 km default visual length (in km to be converted by caller)
      coneRadiusKm: 1.5,
      particleCount: 120,
      particleSpreadKm: 0.6,
      lightColor: 0xffaa66,
      lightIntensity: 2.5
    }, opts ?? {});

    this.group = new THREE.Group();

    // --- Cone core (solid) ---
    // Cone pointing down local -Z (we'll align later). Use height=1 and scale to desired length.
    const coreGeom = new THREE.ConeGeometry(1, 1, 16, 1, true);
    const coreMat = new THREE.MeshBasicMaterial({
      color: this.opts.coneColor,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.cone = new THREE.Mesh(coreGeom, coreMat);
    // move origin to tip (so nozzle is at origin)
    this.cone.geometry.translate(0, 0.45, -1);
    // rotate so cone points -Z instead of -Y (if needed)
    this.cone.rotateX(Math.PI * 0.5);
    markForBloom(this.cone);
    this.group.add(this.cone);

    // --- Outer soft glow (slightly larger, lower opacity) ---
    const glowGeom = new THREE.ConeGeometry(1, 1, 16, 1, true);
    const glowMat = new THREE.MeshBasicMaterial({
      color: this.opts.glowColor,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.glow = new THREE.Mesh(glowGeom, glowMat);
    this.glow.geometry.translate(0, 0.45, -1);
    this.glow.rotateX(Math.PI * 0.5);
    markForBloom(this.glow);
    this.group.add(this.glow);

  }


  public attachTo(parent: THREE.Object3D) {
    parent.add(this.group);
    // position nozzle at ship origin or offset if needed (0,0,0)
    this.group.position.set(0, 0, 0);
  }

  public update(throttle: number, engineOn: boolean, kmToSceneUnits: (km: number) => number) {
    // scale cone & glow length + radius according to throttle (and add a bit of flicker)
    const baseLen = kmToSceneUnits(this.opts.coneLengthKm);
    const baseRad = kmToSceneUnits(this.opts.coneRadiusKm);
    const flick = 1 + (Math.sin(Date.now() * 0.02) * 0.08); // gentle flicker
    const t = engineOn ? throttle : 0;

    // scale: length along -Z; cone geometry built to height=1 so scale Y accordingly
    const coreScaleY = Math.max(0.01, baseLen * (0.2 + 0.018 * t) * flick);
    const coreScaleXZ = Math.max(0.01, baseRad * (0.2 + 0.018 * t));
    this.cone.scale.set(coreScaleXZ, coreScaleY, coreScaleXZ);
    (this.cone.material as THREE.Material).opacity = 0.6 + 0.06 * t;

    this.glow.scale.set(coreScaleXZ * 1.5 * 0.01, coreScaleY * 1.2 *  0.01, coreScaleXZ * 1.5 * 0.01);
    (this.glow.material as THREE.Material).opacity = 0.35 + 0.06 * t;

  }

  public dispose() {
    this.cone.geometry.dispose();
    (this.cone.material as THREE.Material).dispose();
    this.glow.geometry.dispose();
    (this.glow.material as THREE.Material).dispose();
  }

  
}
