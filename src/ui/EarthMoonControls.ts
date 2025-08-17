import { GUI } from "lil-gui";
import { Earth } from "../objects/Earth";
import { Moon } from "../objects/Moon";
import { Barycenter } from "../physics/Barycenter";

export class EarthMoonControls {
  public folder: GUI;
  private earth: Earth;
  private moon: Moon;
  private bary: Barycenter;

  private state = {
    showBarycenter: true,
    earthMoonDistance_km: "0",
    dEarthToBary_km: "0",
    dMoonToBary_km: "0",
    baryInsideEarth: "—",
  };

  private controls: {
    dEM?: any;
    dEB?: any;
    dMB?: any;
    insideCtrl?: any;
    showCtrl?: any;
  } = {};

  constructor(gui: GUI, earth: Earth, moon: Moon, bary: Barycenter) {
    this.earth = earth;
    this.moon = moon;
    this.bary = bary;
    this.folder = gui.addFolder("Earth-Moon");

    this.setupControls();
  }

  private setupControls() {
    this.controls.showCtrl = this.folder.add(this.state, "showBarycenter")
      .name("Show Barycenter")
      .onChange((v: boolean) => {
        this.bary.visible = v;
        this.bary.marker.visible = v;
      });

    this.controls.dEM = this.folder.add(this.state, "earthMoonDistance_km").name("Earth–Moon (km)");
    this.controls.dEB = this.folder.add(this.state, "dEarthToBary_km").name("Earth→Bary (km)");
    this.controls.dMB = this.folder.add(this.state, "dMoonToBary_km").name("Moon→Bary (km)");
    this.controls.insideCtrl = this.folder.add(this.state, "baryInsideEarth").name("Bary Inside Earth?");

  }

  public update() {
    const dEarthToMoon_m = this.earth.r_m.distanceTo(this.moon.r_m);
    const dEarthToBary_m = this.bary.distanceFrom(this.earth);
    const dMoonToBary_m = this.bary.distanceFrom(this.moon);

    this.state.earthMoonDistance_km = (dEarthToMoon_m / 1000).toFixed(1);
    this.state.dEarthToBary_km = (dEarthToBary_m / 1000).toFixed(1);
    this.state.dMoonToBary_km = (dMoonToBary_m / 1000).toFixed(1);
    this.state.baryInsideEarth = dEarthToBary_m < this.earth.radius ? "Yes" : "No";

    this.controls.dEM?.updateDisplay();
    this.controls.dEB?.updateDisplay();
    this.controls.dMB?.updateDisplay();
    this.controls.insideCtrl?.updateDisplay();
  }

}
