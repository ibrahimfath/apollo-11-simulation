import { GUI } from "lil-gui";
import * as THREE from "three";
import { Atmosphere } from "../objects/Atmosphere";

export class AtmosphereControls {
  public folder: GUI;
  private atmosphere: Atmosphere;

  private defaults = {
    rimHex: 0x0088ff,
    facingHex: 0x000000,
    bias: 0.1,
    scale: 0.5,
    power: 5.0,
    rho0: 2.0e-9,
    H: 60_000,
    hBase: 120_000,
    hCutoff: 1_000_000,
  };

  

  constructor(parentFolder: GUI, atmosphere: Atmosphere) {
    this.atmosphere = atmosphere;
    this.folder = parentFolder.addFolder("Atmosphere");
    this.setupControls();
  }

  private setupControls() {
    // ---------------- VISUAL CONTROLS ----------------
    this.folder.addColor(this.atmosphere, "rimHex").name("Rim Color").onChange((v: number) => {
      (this.atmosphere.material!.uniforms.color1.value as THREE.Color).setHex(v);
    });

    this.folder.addColor(this.atmosphere, "facingHex").name("Facing Color").onChange((v: number) => {
      (this.atmosphere.material!.uniforms.color2.value as THREE.Color).setHex(v);
    });

    this.folder.add(this.atmosphere, "bias", 0, 10).name("Atmosphere Bias").onChange((v: number) => {
      this.atmosphere.material!.uniforms.atmosphereBias.value = v;
    });

    this.folder.add(this.atmosphere, "scale", 0, 50).name("Atmosphere Scale").onChange((v: number) => {
      this.atmosphere.material!.uniforms.atmosphereScale.value = v;
    });

    this.folder.add(this.atmosphere, "power", 0, 50).name("Atmosphere Power").onChange((v: number) => {
      this.atmosphere.material!.uniforms.atmospherePower.value = v;
    });

    // ---------------- PHYSICS CONTROLS ----------------
    this.folder.add(this.atmosphere, "rho0", 1e-12, 1e-6)
      .name("ρ0 @ hBase (kg/m³)")
      .step(1e-12);

    this.folder.add(this.atmosphere, "H", 10_000, 100_000)
      .name("Scale Height H (m)")
      .step(1000);

    this.folder.add(this.atmosphere, "hBase", 50_000, 200_000)
      .name("hBase (m)")
      .step(1000);

    this.folder.add(this.atmosphere, "hCutoff", 500_000, 2_000_000)
      .name("hCutoff (m)")
      .step(10_000);

    // ---------------- RESET ----------------
    this.folder.add({ reset: () => this.reset() }, "reset").name("Reset Atmosphere");
  }

  /** Call every frame to refresh debug readouts. */

  public reset() {
    // reset visuals
    (this.atmosphere.material!.uniforms.color1.value as THREE.Color).setHex(this.defaults.rimHex);
    (this.atmosphere.material!.uniforms.color2.value as THREE.Color).setHex(this.defaults.facingHex);
    this.atmosphere.material!.uniforms.atmosphereBias.value = this.defaults.bias;
    this.atmosphere.material!.uniforms.atmosphereScale.value = this.defaults.scale;
    this.atmosphere.material!.uniforms.atmospherePower.value = this.defaults.power;

    // reset physics
    this.atmosphere.rho0 = this.defaults.rho0;
    this.atmosphere.H = this.defaults.H;
    this.atmosphere.hBase = this.defaults.hBase;
    this.atmosphere.hCutoff = this.defaults.hCutoff;

    this.folder.controllers.forEach(ctrl => ctrl.updateDisplay());
  }
}
