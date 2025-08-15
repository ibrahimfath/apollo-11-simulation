import { GUI } from "lil-gui";
import { Sun } from "../objects/Sun";

export function createSunControls(gui: GUI, sun: Sun) {
  const folder = gui.addFolder("Sun");

  const defaults = {
    color: 0xffffff,
    intensity: 3.0,
  };

  const params = {
    lightColor: defaults.color,
    intensity: defaults.intensity,
  };

  const colorCtrl = folder
    .addColor(params, "lightColor")
    .name("Light Color")
    .onChange((value: number) => {
      sun.light.color.setHex(value);
    });

  const intensityCtrl = folder
    .add(params, "intensity", 0, 10)
    .name("Light Intensity")
    .onChange((value: number) => {
      sun.light.intensity = value;
    });

  folder.add(
    {
      reset: () => {
        params.lightColor = defaults.color;
        params.intensity = defaults.intensity;

        sun.light.color.setHex(defaults.color);
        sun.light.intensity = defaults.intensity;

        colorCtrl.setValue(defaults.color);
        intensityCtrl.setValue(defaults.intensity);
      },
    },
    "reset"
  ).name("Reset Sun");

  return {
    folder,
    reset: () => {
      const ctrl = folder.controllers.find(c => c.property === "reset");
      (ctrl?.object as { reset: () => void })?.reset();
    },
  };
}
