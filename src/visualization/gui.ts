// src/visualization/gui.ts
import * as THREE from "three";
import GUI from "lil-gui";
import { Earth } from "./Earth";
import { Moon } from "./Moon";
import { TimeController } from "../physics/TimeController";

export function setupGUI(earth: Earth, moon: Moon, time: TimeController) {
  const gui = new GUI();
  
  //
  // --- TIME FOLDER ---
  //
  const timeFolder = gui.addFolder("Time");
  
  const defaultTime = {
    scale: time.scale,
  };
  
  const timeScaleCtrl = timeFolder.add(time, "scale", 0.1, 10000).name("Time Scale");
  
  // Reset time button (also resets GUI)
  timeFolder.add(
    {
      reset: () => {
        time.setScale(defaultTime.scale);
        timeScaleCtrl.setValue(defaultTime.scale);
      },
    },
    "reset"
  ).name("Reset Time");
  
  gui.close(); // start closed
}
