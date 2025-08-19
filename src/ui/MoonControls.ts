import { GUI } from "lil-gui";
import * as THREE from "three";
import { Moon } from "../objects/Moon";

export class MoonControls {
  private moon: Moon;
  public folder: GUI;
  private physicsState = { pos: "(0,0,0)", vel: "(0,0,0)", acc: "(0,0,0)" };

  private defaults = {
    mass: 7.34767309e22,
    radius: 1_737_400,
    rotationPeriod: 24,
    totalRotationPeriod: 27.32 * 24 * 3600,
    axialTilt: 6.68,
    bumpScale: 0.5,
    sampleRate: 50,
    maxPoints: 3000,
  };

  constructor(gui: GUI, moon: Moon) {
    this.moon = moon;
    this.folder = gui.addFolder("Moon");

    if (moon.mesh.material instanceof THREE.MeshPhongMaterial) {
      this.defaults.bumpScale = moon.mesh.material.bumpScale;
    }

    this.setupControls();
  }

  private setupControls() {
    const massCtrl = this.folder.add(this.moon, "mass", 1e10, 1e25).name("Mass");
    const rotCtrl = this.folder.add(this.moon, "rotationPeriod", 1, 100)
      .name("Rotation Period")
      .onChange((v: number) => {
        this.moon.rotationPeriod = v;
        this.moon.totalRotationPeriod =  27.32 * v * 3600;
      });

    const radiusCtrl = this.folder.add(this.moon, "radius", 1_000_000, 31_855_000)
      .name("Radius")
      .onChange((v: number) => this.moon.setRadius(v));

    const tiltCtrl = this.folder.add(this.moon, "axialTilt", -45, 45)
      .name("Axial Tilt (°)")
      .onChange(() => {
        this.moon.group.rotation.z = -this.moon.axialTilt * Math.PI / 180;
      });

    let bumpCtrl: any;
    if (this.moon.mesh.material instanceof THREE.MeshPhongMaterial && this.moon.mesh.material.bumpMap) {
      bumpCtrl = this.folder.add(this.moon.mesh.material, "bumpScale", 0, 5).name("Bump Scale");
    }

    this.folder.add(this.physicsState, "pos").name("Position (m)");
    this.folder.add(this.physicsState, "vel").name("Velocity (m/s)");
    this.folder.add(this.physicsState, "acc").name("Accel (m/s²)");

    const sampleRateCtrl = this.folder.add(this.moon.trail, "sampleRate", 1, 500).step(1).name("Orbit Trail Sample Rate").onChange((value: number) => {
      this.moon.trail.frameCounter = 0;
      this.moon.trail.sampleRate = value;
    });

    const MaxPointsCtrl = this.folder.add(this.moon.trail, "maxPoints", 0, 5000).step(1).name("Orbit Trail Max Points");

    this.folder.add({ reset: () => this.reset(massCtrl, radiusCtrl, rotCtrl, tiltCtrl, bumpCtrl, sampleRateCtrl, MaxPointsCtrl) }, "reset").name("Reset Moon");
  }

  public update() {
    this.physicsState.pos = `(${this.moon.r_m.x.toFixed(2)}, ${this.moon.r_m.y.toFixed(2)}, ${this.moon.r_m.z.toFixed(2)})`;
    this.physicsState.vel = `(${this.moon.v_mps.x.toFixed(2)}, ${this.moon.v_mps.y.toFixed(2)}, ${this.moon.v_mps.z.toFixed(2)})`;
    this.physicsState.acc = `(${this.moon.a_mps2.x.toFixed(4)}, ${this.moon.a_mps2.y.toFixed(4)}, ${this.moon.a_mps2.z.toFixed(4)})`;

    this.folder.controllers.forEach(ctrl => ctrl.updateDisplay());
  }

  public reset(...ctrls: any[]) {
    this.moon.mass = this.defaults.mass;
    this.moon.setRadius(this.defaults.radius);
    this.moon.rotationPeriod = this.defaults.rotationPeriod;
    this.moon.totalRotationPeriod = this.defaults.totalRotationPeriod;
    this.moon.axialTilt = this.defaults.axialTilt;
    this.moon.group.rotation.z = -this.defaults.axialTilt * Math.PI / 180;
    this.moon.trail.sampleRate = this.defaults.sampleRate;
    this.moon.trail.frameCounter = 0;

    if (this.moon.mesh.material instanceof THREE.MeshPhongMaterial) {
      this.moon.mesh.material.bumpScale = this.defaults.bumpScale;
    }

    this.folder.controllers.forEach(ctrl => ctrl.updateDisplay());
  }
}
