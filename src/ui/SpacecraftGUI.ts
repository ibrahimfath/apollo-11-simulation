import * as THREE from "three";
import GUI from "lil-gui";
import { Spacecraft } from "../objects/Spacecraft";
import { computeDragAccel } from "../physics/Drag";
import type { Atmosphere } from "../objects/Atmosphere";
import type { Earth } from "../objects/Earth";
import { computeOrbitElements, formatDistanceKm, formatSmaKm, formatPeriod } from "../physics/orbitTools";
import { G } from "../physics/constants";
import { HohmannTransfer } from "../physics/HohmannTransfer";

export class SpacecraftGUI {
  public gui: GUI;
  private spacecraft: Spacecraft;
  private atmosphere: Atmosphere;
  private earth: Earth
  private hohmannTransfer: HohmannTransfer;

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

  private hohmannState = {
    transferTime: "0",
    distanceToMoon: "0",
  };

  private defaults = {
    mass: 137_000,
    dryMass: 13_000,
    fuelMass: 120_000,
    radius: 10_000,
    sampleRate: 50,
    maxPoints: 5000,
  };

  private orbitState = { sma: "—", ecc: "—", rp: "—", ra: "—", period: "—" };

  constructor(spacecraft: Spacecraft, atmosphere: Atmosphere, earth: Earth, hohmannTransfer: HohmannTransfer) {
    this.spacecraft = spacecraft;
    this.atmosphere = atmosphere;
    this.earth = earth;
    this.hohmannTransfer = hohmannTransfer;
    
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
    general.add(this.spacecraft, "mass").name("Mass (kg)");
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

    // Orbit analysis folder
    const orbitFolder = this.gui.addFolder("Orbit (w.r.t. Earth)");
    orbitFolder.add(this.orbitState, "sma").name("Semi-major axis (km)");
    orbitFolder.add(this.orbitState, "ecc").name("Eccentricity");
    orbitFolder.add(this.orbitState, "rp").name("Perigee (km)");
    orbitFolder.add(this.orbitState, "ra").name("Apogee (km)");
    orbitFolder.add(this.orbitState, "period").name("Period");

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

    // Thrust controls
    const thrust = this.gui.addFolder("Thrust");
    thrust.add(this.spacecraft, "engineOn").name("Engine On");
    thrust.add(this.spacecraft, "T_max_N", 0, 1e6).name("Max Thrust (N)");
    thrust.add(this.spacecraft, "throttle", 0, 1).name("Throttle").step(0.01);
    thrust.add(this.spacecraft, "isp_s", 0, 1000).name("ISP (s)");

    // Direction mode selector
    thrust.add(this.spacecraft, "thrustMode", ["prograde", "retrograde", "radial_out", "radial_in", "normal_plus", "normal_minus", "custom"])
      .name("Direction Mode");
    
    // Optional: allow custom vector if mode = custom
    const customDir = { x: 1, y: 0, z: 0 };
    thrust.add(customDir, "x", -1, 1, 0.01).name("Custom X").onChange(() => {
      this.spacecraft.thrustDirection_world = new THREE.Vector3(customDir.x, customDir.y, customDir.z).normalize();
    });
    thrust.add(customDir, "y", -1, 1, 0.01).name("Custom Y").onChange(() => {
      this.spacecraft.thrustDirection_world = new THREE.Vector3(customDir.x, customDir.y, customDir.z).normalize();
    });
    thrust.add(customDir, "z", -1, 1, 0.01).name("Custom Z").onChange(() => {
      this.spacecraft.thrustDirection_world = new THREE.Vector3(customDir.x, customDir.y, customDir.z).normalize();
    });

    // Burn helpers
    const burns = this.gui.addFolder("Impulse Burns");
    burns.add({ prograde: () => this.spacecraft.burnPrograde(100) }, "prograde").name("Δv +100 m/s Prograde");
    burns.add({ retro:   () => this.spacecraft.burnRetrograde(100) }, "retro").name("Δv -100 m/s Retrograde");
    burns.add({ radialOut: () => this.spacecraft.burnRadialOut(100, this.earth.r_m) }, "radialOut").name("Δv Radial Out");
    burns.add({ radialIn:  () => this.spacecraft.burnRadialIn(100, this.earth.r_m) }, "radialIn").name("Δv Radial In");
    burns.add({ normal:    () => this.spacecraft.burnNormal(100) }, "normal").name("Δv Normal");
    burns.add({ antiNormal:() => this.spacecraft.burnAntiNormal(100) }, "antiNormal").name("Δv Anti-Normal");

    // Hohmann Transfer
    const hohmannFolder = this.gui.addFolder("Hohmann Transfer");
    hohmannFolder.add(this.hohmannState, "distanceToMoon").name("Distance to Moon");
    hohmannFolder.add(this.hohmannState, "transferTime").name("Transfer Time");
    hohmannFolder.add(this.hohmannTransfer, "phase").name("Phase");
    hohmannFolder.add(this.hohmannTransfer, "deltaV1").name("Δv1");
    hohmannFolder.add(this.hohmannTransfer, "deltaV2").name("Δv2");
    hohmannFolder.add({ triggerFirst: () => this.hohmannTransfer.triggerFirstBurn() }, "triggerFirst").name("Trigger First Burn");
    hohmannFolder.add({ triggerSecond: () => this.hohmannTransfer.triggerSecondBurn() }, "triggerSecond").name("Trigger Second Burn");

    // Reset button
    this.gui.add({ reset: () => this.reset() }, "reset").name("Reset Spacecraft");

    this.gui.close();
  }

  public update() {
    // Update telemetry strings from spacecraft physics state
    this.telemetry.pos = `(${this.spacecraft.r_m.x.toFixed(2)}, ${this.spacecraft.r_m.y.toFixed(2)}, ${this.spacecraft.r_m.z.toFixed(2)})`;
    this.telemetry.vel = `(${this.spacecraft.v_mps.x.toFixed(2)}, ${this.spacecraft.v_mps.y.toFixed(2)}, ${this.spacecraft.v_mps.z.toFixed(2)})`;
    this.telemetry.acc = `(${this.spacecraft.a_mps2.x.toFixed(4)}, ${this.spacecraft.a_mps2.y.toFixed(4)}, ${this.spacecraft.a_mps2.z.toFixed(4)})`;
    
    this.defaults.mass = this.spacecraft.mass;

    // orbit elements relative to Earth
    const rRel = this.spacecraft.r_m.clone().sub(this.earth.r_m);
    const vRel = this.spacecraft.v_mps.clone().sub(this.earth.v_mps);
    const mu = G * this.earth.mass;
    const elements = computeOrbitElements(rRel, vRel, mu);

    this.orbitState.sma = elements.sma ? formatSmaKm(elements.sma) : (elements.isBound ? "—" : "Unbound");
    this.orbitState.ecc = `${elements.ecc.toFixed(6)}`;
    this.orbitState.rp = formatDistanceKm(elements.rp);
    this.orbitState.ra = formatDistanceKm(elements.ra);
    this.orbitState.period = formatPeriod(elements.period);


    const h = this.spacecraft.r_m.distanceTo(this.earth.r_m) - this.earth.radius;
    const rho = this.atmosphere.densityAtAltitude(h);

    this.hohmannState.distanceToMoon = formatDistanceKm(this.hohmannTransfer.distanceToMoon);
    this.hohmannState.transferTime = this.hohmannTransfer.formatTime();

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
