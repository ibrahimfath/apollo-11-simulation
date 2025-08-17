import { GUI } from "lil-gui";
import * as THREE from "three";
import { Atmosphere } from "../objects/Atmosphere";

export class AtmosphereControls {
  public folder: GUI;
  private atmosphere: Atmosphere;

  private defaults = {
    rimHex: 0x0088ff,
    facingHex: 0x000000,
    bias: 0.206,
    scale: 1.7,
    power: 5.0,
  };

  constructor(parentFolder: GUI, atmosphere: Atmosphere) {
    this.atmosphere = atmosphere;
    this.folder = parentFolder.addFolder("Atmosphere");
    this.setupControls();
  }

  private setupControls() {
    this.folder.addColor(this.atmosphere, "rimHex").name("Rim Color").onChange((v: number) => {
      (this.atmosphere.material!.uniforms.color1.value as THREE.Color).setHex(v);
    });

    this.folder.addColor(this.atmosphere, "facingHex").name("Facing Color").onChange((v: number) => {
      (this.atmosphere.material!.uniforms.color2.value as THREE.Color).setHex(v);
    });

    this.folder.add(this.atmosphere, "bias", 0, 10).name("Atmosphere Bias").onChange((v: number) => {
      this.atmosphere.material!.uniforms.atmosphereBias.value = v;
    });

    this.folder.add(this.atmosphere, "scale", 0, 10).name("Atmosphere Scale").onChange((v: number) => {
      this.atmosphere.material!.uniforms.atmosphereScale.value = v;
    });

    this.folder.add(this.atmosphere, "power", 0, 50).name("Atmosphere Power").onChange((v: number) => {
      this.atmosphere.material!.uniforms.atmospherePower.value = v;
    });

    this.folder.add({ reset: () => this.reset() }, "reset").name("Reset Atmosphere");
  }

  public reset() {
    (this.atmosphere.material!.uniforms.color1.value as THREE.Color).setHex(this.defaults.rimHex);
    (this.atmosphere.material!.uniforms.color2.value as THREE.Color).setHex(this.defaults.facingHex);
    this.atmosphere.material!.uniforms.atmosphereBias.value = this.defaults.bias;
    this.atmosphere.material!.uniforms.atmosphereScale.value = this.defaults.scale;
    this.atmosphere.material!.uniforms.atmospherePower.value = this.defaults.power;

    Object.assign(this.atmosphere, this.defaults);
    this.folder.controllers.forEach(ctrl => ctrl.updateDisplay());
  }
}
