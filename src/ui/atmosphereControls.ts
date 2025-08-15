import { GUI } from "lil-gui";
import * as THREE from "three";
import { Atmosphere } from "../objects/Atmosphere";

export function createAtmosphereControls(parentFolder: GUI, atmosphere: Atmosphere) {
  const folder = parentFolder.addFolder("Atmosphere");

  const defaults = {
    rimHex: 0x0088ff,
    facingHex: 0x000000,
    bias: 0.1,
    scale: 0.27,
    power: 5.0,
  };

  const rimColorCtrl = folder
    .addColor(atmosphere, "rimHex")
    .name("Rim Color")
    .onChange((v: number) => {
      (atmosphere.material!.uniforms.color1.value as THREE.Color).setHex(v);
    });

  const facingColorCtrl = folder
    .addColor(atmosphere, "facingHex")
    .name("Facing Color")
    .onChange((v: number) => {
      (atmosphere.material!.uniforms.color2.value as THREE.Color).setHex(v);
    });

  const biasCtrl = folder
    .add(atmosphere, "bias", 0, 1)
    .name("Atmosphere Bias")
    .onChange((v: number) => {
      atmosphere.material!.uniforms.atmosphereBias.value = v;
    });

  const scaleCtrl = folder
    .add(atmosphere, "scale", 0, 1)
    .name("Atmosphere Scale")
    .onChange((v: number) => {
      atmosphere.material!.uniforms.atmosphereScale.value = v;
    });

  const powerCtrl = folder
    .add(atmosphere, "power", 0, 10)
    .name("Atmosphere Power")
    .onChange((v: number) => {
      atmosphere.material!.uniforms.atmospherePower.value = v;
    });

  folder.add(
    { reset: () => {
        (atmosphere.material!.uniforms.color1.value as THREE.Color).setHex(defaults.rimHex);
        (atmosphere.material!.uniforms.color2.value as THREE.Color).setHex(defaults.facingHex);
        atmosphere.material!.uniforms.atmosphereBias.value = defaults.bias;
        atmosphere.material!.uniforms.atmosphereScale.value = defaults.scale;
        atmosphere.material!.uniforms.atmospherePower.value = defaults.power;

        atmosphere.rimHex = defaults.rimHex;
        atmosphere.facingHex = defaults.facingHex;
        atmosphere.bias = defaults.bias;
        atmosphere.scale = defaults.scale;
        atmosphere.power = defaults.power;

        rimColorCtrl.setValue(defaults.rimHex);
        facingColorCtrl.setValue(defaults.facingHex);
        biasCtrl.setValue(defaults.bias);
        scaleCtrl.setValue(defaults.scale);
        powerCtrl.setValue(defaults.power);
      }
    }, "reset"
  ).name("Reset Atmosphere");
  return {
    folder,
    reset: () => {
        const ctrl = folder.controllers.find(c => c.property === "reset");
        (ctrl?.object as { reset: () => void })?.reset();
    }
  };
}
