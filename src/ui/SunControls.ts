import { GUI } from "lil-gui";
import { Sun } from "../objects/Sun";

export class SunControls {
  public folder: GUI;
  private sun: Sun;

  private defaults = { color: 0xffffff, intensity: 3.0 };
  private params = { lightColor: 0xffffff, intensity: 3.0 };

  constructor(gui: GUI, sun: Sun) {
    this.sun = sun;
    this.folder = gui.addFolder("Sun");
    this.setupControls();
  }

  private setupControls() {
    this.folder.addColor(this.params, "lightColor").name("Light Color").onChange((value: number) => {
      this.sun.light.color.setHex(value);
    });

    this.folder.add(this.params, "intensity", 0, 10).name("Light Intensity").onChange((value: number) => {
      this.sun.light.intensity = value;
    });

    this.folder.add({ reset: () => this.reset() }, "reset").name("Reset Sun");
  }

  public reset() {
    this.params.lightColor = this.defaults.color;
    this.params.intensity = this.defaults.intensity;

    this.sun.light.color.setHex(this.defaults.color);
    this.sun.light.intensity = this.defaults.intensity;

    this.folder.controllers.forEach(ctrl => ctrl.updateDisplay());
  }
}
