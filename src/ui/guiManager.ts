import GUI from "lil-gui";
import { Earth } from "../objects/Earth";
import { Moon } from "../objects/Moon";
import { Sun } from "../objects/Sun";
import { TimeController } from "../physics/TimeController";
import { createTimeControls } from "./timeControls";
import { createEarthControls } from "./earthControls";
import { createMoonControls } from "./moonControls";
import { createSunControls } from "./sunControls";
import { createEarthMoonControls } from "./earthMoonControls";
import type { Barycenter } from "../physics/Barycenter";

export function setupGUI(earth: Earth, moon: Moon, sun: Sun, time: TimeController, bary: Barycenter) {
  const gui = new GUI({
    width: 400,
    title: "Simulation Controls",
  });

  const timeUI = createTimeControls(gui, time);
  const earthUI = createEarthControls(gui, earth);
  const moonUI = createMoonControls(gui, moon, earth);
  const earthMoonUI = createEarthMoonControls(gui, earth, moon, bary);
  const sunUI = createSunControls(gui, sun);

  gui.add({ resetAll: () => {
      timeUI.reset();
      earthMoonUI.reset();
      earthUI.reset();
      moonUI.reset();
      sunUI.reset();
    }
  }, "resetAll").name("Reset All");

  gui.close();

  return { gui, timeUI, earthMoonUI,  earthUI, moonUI, sunUI };
}
