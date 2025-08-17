import { GUI } from "lil-gui";
import * as THREE from "three";
import { Earth } from "../objects/Earth";
import { AtmosphereControls } from "./AtmosphereControls";

export class EarthControls {
  private earth: Earth;
  public folder: GUI;
  private atmosphere: AtmosphereControls;
  private physicsState = { pos: "(0,0,0)", vel: "(0,0,0)", acc: "(0,0,0)" };

  private defaults = {
    mass: 5.972e24,
    radius: 6_371_000,
    axialTilt: 23.4,
    rotationPeriod: 23.93,
    cloudOpacity: 0.8,
    wireframe: false,
  };

  constructor(gui: GUI, earth: Earth) {
    this.earth = earth;
    this.folder = gui.addFolder("Earth");

    this.setupControls();
    this.atmosphere = new AtmosphereControls(this.folder, earth.atmosphere);
  }

  private setupControls() {
    const earthMat = this.earth.mesh.material as THREE.MeshPhongMaterial;
    const cloudsMat = this.earth.clouds!.material as THREE.MeshStandardMaterial;

    this.defaults.wireframe = earthMat.wireframe;

    const massCtrl = this.folder.add(this.earth, "mass", 1e10, 1e25).name("Mass");
    const radiusCtrl = this.folder.add(this.earth, "radius", 1_000_000, 31_855_000)
      .name("Radius")
      .onChange((v: number) => this.earth.setRadius(v));

    const tiltCtrl = this.folder.add(this.earth, "axialTilt", -45, 45)
      .name("Axial Tilt (°)")
      .onChange(() => {
        this.earth.group.rotation.z = -this.earth.axialTilt * Math.PI / 180;
      });

    const rotCtrl = this.folder.add(this.earth, "rotationPeriod", 1, 100)
      .name("Rotation Period")
      .onChange((v: number) => {
        this.earth.rotationPeriod = v;
        this.earth.totalRotationPeriod = v * 3600;
      });

    const cloudOpacityCtrl = this.folder.add(cloudsMat, "opacity", 0, 1).name("Cloud Opacity");
    const wireframeCtrl = this.folder.add(earthMat, "wireframe").name("Wireframe");

    this.folder.add({ toggleClouds: () => { this.earth.clouds!.visible = !this.earth.clouds!.visible; } }, "toggleClouds").name("Toggle Clouds");

    this.folder.add(this.physicsState, "pos").name("Position (m)");
    this.folder.add(this.physicsState, "vel").name("Velocity (m/s)");
    this.folder.add(this.physicsState, "acc").name("Accel (m/s²)");

    this.folder.add({ reset: () => this.reset(massCtrl, radiusCtrl, tiltCtrl, rotCtrl, cloudOpacityCtrl, wireframeCtrl) }, "reset").name("Reset Earth");
  }

  public update() {
    this.physicsState.pos = `(${this.earth.r_m.x.toFixed(2)}, ${this.earth.r_m.y.toFixed(2)}, ${this.earth.r_m.z.toFixed(2)})`;
    this.physicsState.vel = `(${this.earth.v_mps.x.toFixed(2)}, ${this.earth.v_mps.y.toFixed(2)}, ${this.earth.v_mps.z.toFixed(2)})`;
    this.physicsState.acc = `(${this.earth.a_mps2.x.toFixed(4)}, ${this.earth.a_mps2.y.toFixed(4)}, ${this.earth.a_mps2.z.toFixed(4)})`;

    this.folder.controllers.forEach(ctrl => ctrl.updateDisplay());
  }

  public reset(...ctrls: any[]) {
    const earthMat = this.earth.mesh.material as THREE.MeshPhongMaterial;
    const cloudsMat = this.earth.clouds!.material as THREE.MeshStandardMaterial;

    this.earth.setRadius(this.defaults.radius);
    this.earth.axialTilt = this.defaults.axialTilt;
    this.earth.mass = this.defaults.mass;
    this.earth.group.rotation.z = -this.defaults.axialTilt * Math.PI / 180;
    this.earth.rotationPeriod = this.defaults.rotationPeriod;
    this.earth.totalRotationPeriod = this.defaults.rotationPeriod * 3600;
    cloudsMat.opacity = this.defaults.cloudOpacity;
    earthMat.wireframe = this.defaults.wireframe;

    ctrls.forEach((ctrl, i) => ctrl.setValue(Object.values(this.defaults)[i]));
    this.atmosphere.reset();
  }
}
