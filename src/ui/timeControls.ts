import { GUI } from "lil-gui";
import { TimeController } from "../physics/TimeController";

export function createTimeControls(gui: GUI, time: TimeController) {
  const folder = gui.addFolder("Time");

  const defaults = { scale: time.scale };

  const scaleCtrl = folder
    .add(time, "scale", 0.1, 10000)
    .name("Time Scale");

  folder.add(
    { reset: () => {
        time.setScale(defaults.scale);
        scaleCtrl.setValue(defaults.scale);
      }
    }, "reset"
  ).name("Reset Time");

  return { folder, reset: () => {
    time.setScale(defaults.scale);
    scaleCtrl.setValue(defaults.scale);
  }};
}
