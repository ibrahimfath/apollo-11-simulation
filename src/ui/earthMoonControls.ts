// src/ui/systemControls.ts
import { GUI } from "lil-gui";
import { Earth } from "../objects/Earth";
import { Moon } from "../objects/Moon";
import { Barycenter } from "../physics/Barycenter";

export function createEarthMoonControls(gui: GUI, earth: Earth, moon: Moon, bary: Barycenter) {
  const folder = gui.addFolder("Earth-Moon");

  const state = {
    showBarycenter: true,
    earthMoonDistance_km: "0",
    dEarthToBary_km: "0",
    dMoonToBary_km: "0",
    baryInsideEarth: "—",
  };

  const showCtrl = folder.add(state, "showBarycenter").name("Show Barycenter")
    .onChange((v: boolean) => {
      bary.visible = v;
      bary.marker.visible = v;
    });

  const dEM = folder.add(state, "earthMoonDistance_km").name("Earth–Moon (km)");
  const dEB = folder.add(state, "dEarthToBary_km").name("Earth→Bary (km)");
  const dMB = folder.add(state, "dMoonToBary_km").name("Moon→Bary (km)");
  const insideCtrl = folder.add(state, "baryInsideEarth").name("Bary Inside Earth?");

  // public updater to call each frame
  function update() {
    const dEarthToMoon_m = earth.r_m.distanceTo(moon.r_m);
    const dEarthToBary_m = bary.distanceFrom(earth);
    const dMoonToBary_m  = bary.distanceFrom(moon);

    state.earthMoonDistance_km = (dEarthToMoon_m / 1000).toFixed(1);
    state.dEarthToBary_km      = (dEarthToBary_m  / 1000).toFixed(1);
    state.dMoonToBary_km       = (dMoonToBary_m   / 1000).toFixed(1);
    state.baryInsideEarth      = dEarthToBary_m < earth.radius ? "Yes" : "No";

    dEM.updateDisplay();
    dEB.updateDisplay();
    dMB.updateDisplay();
    insideCtrl.updateDisplay();
  }

  // Reset just restores marker visibility (distances are dynamic)
  folder.add({ reset: () => {
      state.showBarycenter = true;
      showCtrl.setValue(true);
      bary.visible = true;
      bary.marker.visible = true;
    }
  }, "reset").name("Reset System");

  return { folder, update, reset: () => {
    const ctrl = folder.controllers.find(c => c.property === "reset");
    (ctrl?.object as { reset: () => void })?.reset();
  }};
}
