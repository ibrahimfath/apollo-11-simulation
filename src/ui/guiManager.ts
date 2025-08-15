import GUI from "lil-gui";
import { Earth } from "../objects/Earth";
import { Moon } from "../objects/Moon";
import { Sun } from "../objects/Sun";
import { TimeController } from "../physics/TimeController";
import { createTimeControls } from "./timeControls";
import { createEarthControls } from "./earthControls";
import { createMoonControls } from "./moonControls";
import { createSunControls } from "./sunControls";

export function setupGUI(earth: Earth, moon: Moon, sun: Sun, time: TimeController) {
  const gui = new GUI({
    width: 300,
    title: "Simulation Controls",
    
  });

  const timeUI = createTimeControls(gui, time);
  const earthUI = createEarthControls(gui, earth);
  const moonUI = createMoonControls(gui, moon);
  const sunUI = createSunControls(gui, sun);

  gui.add({ resetAll: () => {
      timeUI.reset();
      earthUI.reset();
      moonUI.reset();
      sunUI.reset();
    }
  }, "resetAll").name("Reset All");

  gui.close();
}
