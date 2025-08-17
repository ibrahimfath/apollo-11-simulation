import { GUI } from "lil-gui";
import { TimeController } from "../physics/TimeController";

export class TimeControls {
  public folder: GUI;
  private time: TimeController;
  private defaults: { scale: number };

  constructor(gui: GUI, time: TimeController) {
    this.time = time;
    this.folder = gui.addFolder("Time");
    this.defaults = { scale: time.scale };

    this.setupControls();
  }

  private setupControls() {
    const scaleCtrl = this.folder.add(this.time, "scale", 0.1, 10000).name("Time Scale");

    this.folder.add(
      { reset: () => this.reset(scaleCtrl) },
      "reset"
    ).name("Reset Time");
  }

  public reset(scaleCtrl?: any) {
    this.time.setScale(this.defaults.scale);
    if (scaleCtrl) scaleCtrl.setValue(this.defaults.scale);
    this.folder.controllers.forEach(ctrl => ctrl.updateDisplay());
  }
}
