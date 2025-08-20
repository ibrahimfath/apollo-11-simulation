import GUI from "lil-gui";
import { Spacecraft } from "../objects/Spacecraft";
import { computeDragAccel } from "../physics/Drag";
import type { Atmosphere } from "../objects/Atmosphere";
import type { Earth } from "../objects/Earth";

export class SpacecraftGUI {
  public gui: GUI;
  private spacecraft: Spacecraft;
  private atmosphere: Atmosphere;
  private earth: Earth

  // state object for telemetry display
  private telemetry = {
    pos: "(0,0,0)",
    vel: "(0,0,0)",
    acc: "(0,0,0)"
  };
  // live state for readouts
  private atmosphereState = {
    altitude: "0 km",
    density: "0",
    aDrag: "0",
  };

  private defaults = {
    dryMass: 13_000,
    fuelMass: 120_000,
    radius: 10_000,
    sampleRate: 50,
    maxPoints: 5000,
  };

  constructor(spacecraft: Spacecraft, atmosphere: Atmosphere, earth: Earth) {
    this.spacecraft = spacecraft;
    this.atmosphere = atmosphere;
    this.earth = earth;

    this.gui = new GUI({
      width: 400,
      title: "Spacecraft Controls"
    });

    // Position GUI in top-left corner
    const dom = this.gui.domElement;
    dom.style.position = "absolute";
    dom.style.left = "10px";
    dom.style.top = "10px";
    // 👇 Apply sci-fi dark theme inline
    Object.assign(dom.style, {
      backgroundColor: "rgba(10, 20, 30, 0.95)", // deep dark blue
      border: "1px solid #00ffcc",
      borderRadius: "8px",
      fontFamily: "monospace",
      fontSize: "13px",
      boxShadow: "0 0 15px rgba(0, 255, 204, 0.4)",
    });
    
    this.setupControls();
  }

  private setupControls() {
    // General properties
    const general = this.gui.addFolder("General");
    general.add(this.spacecraft, "dryMass", 1000, 50_000).name("Dry Mass (kg)");
    general.add(this.spacecraft, "fuelMass", 0, 200_000).name("Fuel Mass (kg)");
    general.add(this.spacecraft, "radius", 0, 100_000).name("Radius (m)").onChange((value: number) => {
      this.spacecraft.setRadius(value);
    });

    // Orbit Trail
    const trail = this.gui.addFolder("Orbit Trail");
    trail.add(this.spacecraft.trail, "sampleRate", 1, 500)
      .step(1)
      .name("Sample Rate")
      .onChange((value: number) => {
        this.spacecraft.trail.frameCounter = 0;
        this.spacecraft.trail.sampleRate = value;
      });
    trail.add(this.spacecraft.trail, "maxPoints", 1, 10_000).step(1).name("Max Points");

    // Telemetry (read-only, updates each frame)
    const telemetryFolder = this.gui.addFolder("Telemetry");
    telemetryFolder.add(this.telemetry, "pos").name("Position (m)");
    telemetryFolder.add(this.telemetry, "vel").name("Velocity (m/s)");
    telemetryFolder.add(this.telemetry, "acc").name("Accel (m/s²)");

    //atmosphere:
    const atmosphereFolder = this.gui.addFolder("Atmosphere");
    atmosphereFolder.add(this.atmosphereState, "altitude").name("Craft Altitude");
    atmosphereFolder.add(this.atmosphereState, "density").name("ρ (kg/m³)");
    atmosphereFolder.add(this.atmosphereState, "aDrag").name("|a_drag| (m/s²)");


    // Reset button
    this.gui.add({ reset: () => this.reset() }, "reset").name("Reset Spacecraft");

    this.gui.close();
  }

  public update() {
    // Update telemetry strings from spacecraft physics state
    this.telemetry.pos = `(${this.spacecraft.r_m.x.toFixed(2)}, ${this.spacecraft.r_m.y.toFixed(2)}, ${this.spacecraft.r_m.z.toFixed(2)})`;
    this.telemetry.vel = `(${this.spacecraft.v_mps.x.toFixed(2)}, ${this.spacecraft.v_mps.y.toFixed(2)}, ${this.spacecraft.v_mps.z.toFixed(2)})`;
    this.telemetry.acc = `(${this.spacecraft.a_mps2.x.toFixed(4)}, ${this.spacecraft.a_mps2.y.toFixed(4)}, ${this.spacecraft.a_mps2.z.toFixed(4)})`;
    
    if (!this.spacecraft) return;

    const h = this.spacecraft.r_m.distanceTo(this.earth.r_m) - this.earth.radius;
    const rho = this.atmosphere.densityAtAltitude(h);

    let aDragMag = 0;
    if (rho > 0) {
      const aDrag = computeDragAccel(this.spacecraft, this.atmosphere);
      aDragMag = aDrag.length();
    }

    this.atmosphereState.altitude = `${(h / 1000).toFixed(1)} km`;
    this.atmosphereState.density = rho.toExponential(3);
    this.atmosphereState.aDrag = aDragMag.toExponential(3);


    // Refresh GUI
    this.gui.controllersRecursive().forEach(ctrl => ctrl.updateDisplay());
  }

  public reset() {
    this.spacecraft.dryMass = this.defaults.dryMass;
    this.spacecraft.fuelMass = this.defaults.fuelMass;
    this.spacecraft.setRadius(this.defaults.radius);
    this.spacecraft.trail.sampleRate = this.defaults.sampleRate;
    this.spacecraft.trail.maxPoints = this.defaults.maxPoints;
    this.spacecraft.trail.frameCounter = 0;

    this.gui.controllersRecursive().forEach(ctrl => ctrl.updateDisplay());
  }
}
