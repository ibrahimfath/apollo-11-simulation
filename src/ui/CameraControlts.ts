import GUI from "lil-gui";
import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface CameraTargets {
  [name: string]: THREE.Object3D;
}

export class CameraControls {
  public folder: GUI;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private sceneScale: number; // meters per scene unit (e.g., 1_000_000)
  private targets: CameraTargets;

  // runtime state
  private state = {
    fov: 75,
    near: 0.1,
    far: 20000,
    posKm: { x: 0, y: 0, z: 20_000 }, // km (note: do not replace this object later)
    lookAt: "None",
    enableRotate: true,
    enablePan: true,
    enableZoom: true,
    rotateSpeed: 1.0,
    zoomSpeed: 1.0,
    panSpeed: 1.0,
    autoRotate: false,
    autoRotateSpeed: 2.0,
    follow: "None" as string, // None | Earth | Moon | Spacecraft ...
    followOffsetKm: { x: 0, y: 50, z: 200 }, // offset in km (do not replace)
    followSmoothing: 0.12, // 0..1 (lerp factor)
    lookAtTarget: true,
  };

  private followTargetObj?: THREE.Object3D;
  private prevPos = new THREE.Vector3(); // used for smoothing

  constructor(opts: {
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    gui: GUI,
    sceneScale?: number, // meters per scene unit
    targets?: CameraTargets
  }) {
    this.camera = opts.camera;
    this.controls = opts.controls;
    this.sceneScale = opts.sceneScale ?? 1_000_000; // default same as your project
    this.targets = opts.targets ?? {};

    this.state.fov = this.camera.fov;
    this.state.near = this.camera.near;
    this.state.far = this.camera.far;

    this.folder = opts.gui.addFolder("Camera");

    this.buildUI();
    // initialize prevPos
    this.prevPos.copy(this.camera.position);
  }

  private kmToSceneUnits(km: number) {
    // scene units = meters / sceneScale
    return (km * 1000) / this.sceneScale;
  }

  private sceneToKm(valSceneUnits: number) {
    return (valSceneUnits * this.sceneScale) / 1000;
  }

  private buildUI() {
    const s = this.state;

    // Camera main
    this.folder.add(s, "fov", 20, 120).name("FOV (deg)").onChange((v: number) => {
      this.camera.fov = v; this.camera.updateProjectionMatrix();
    });
    this.folder.add(s, "near", 0.01, 1000).name("Near").onChange((v: number) => { this.camera.near = v; this.camera.updateProjectionMatrix(); });
    this.folder.add(s, "far", 1e4, 1e10).name("Far").onChange((v: number) => { this.camera.far = v; this.camera.updateProjectionMatrix(); });

    // position in km (easier to reason)
    const posFolder = this.folder.addFolder("Position (km)");
    posFolder.add(s.posKm, "x", -1_000_000, 1_000_000).name("X").onChange((v: number) => {
      s.posKm.x = v;
      this.applyPosKm(); // apply as user moves slider
    });
    posFolder.add(s.posKm, "y", -1_000_000, 1_000_000).name("Y").onChange((v: number) => {
      s.posKm.y = v;
      this.applyPosKm();
    });
    posFolder.add(s.posKm, "z", -1_000_000, 1_000_000).name("Z").onChange((v: number) => {
      s.posKm.z = v;
      this.applyPosKm();
    });
    posFolder.add({ resetPos: () => this.resetPosition() }, "resetPos").name("Reset Position");

    // orbit controls tuning
    const ctrlFolder = this.folder.addFolder("Interaction");
    ctrlFolder.add(s, "enableRotate").name("Enable Rotate").onChange((v: boolean) => this.controls.enableRotate = v);
    ctrlFolder.add(s, "enablePan").name("Enable Pan").onChange((v: boolean) => this.controls.enablePan = v);
    ctrlFolder.add(s, "enableZoom").name("Enable Zoom").onChange((v: boolean) => this.controls.enableZoom = v);
    ctrlFolder.add(s, "rotateSpeed", 0.1, 4).name("Rotate Speed").onChange((v: number) => this.controls.rotateSpeed = v);
    ctrlFolder.add(s, "zoomSpeed", 0.1, 4).name("Zoom Speed").onChange((v: number) => this.controls.zoomSpeed = v);
    ctrlFolder.add(s, "panSpeed", 0.1, 4).name("Pan Speed").onChange((v: number) => this.controls.panSpeed = v);
    ctrlFolder.add(s, "autoRotate").name("Auto Rotate").onChange((v:boolean) => this.controls.autoRotate = v);
    ctrlFolder.add(s, "autoRotateSpeed", 0.1, 10).name("AutoRotate Speed").onChange((v:number) => this.controls.autoRotateSpeed = v);

    // Follow modes
    const followFolder = this.folder.addFolder("Follow");
    const followOptions = ["None", ...Object.keys(this.targets)];
    followFolder.add(s, "follow", followOptions).name("Follow Target").onChange((name: string) => {
      this.setFollowTarget(name);
    });

    // NOTE: do not replace followOffsetKm object later; edit its fields
    followFolder.add(s.followOffsetKm, "x", -100_000, 100_000).name("Offset X (km)").onChange((value: number) => {
      s.followOffsetKm.x = value;
    });
    followFolder.add(s.followOffsetKm, "y", -100_000, 100_000).name("Offset Y (km)").onChange((value: number) => {
      s.followOffsetKm.y = value;
    });
    followFolder.add(s.followOffsetKm, "z", -100_000, 100_000).name("Offset Z (km)").onChange((value: number) => {
      s.followOffsetKm.z = value;
    });
    followFolder.add(s, "followSmoothing", 0, 1).name("Smoothing (0 snap)").step(0.01);
    followFolder.add(s, "lookAtTarget").name("Look at Target");

    this.folder.add({ reset: () => this.reset() }, "reset").name("Reset Camera");    
    
    // collapse for cleanliness
    posFolder.close();
    ctrlFolder.close();
    followFolder.close();

    // initialize slider values from camera
    this.state.posKm.x = this.sceneToKm(this.camera.position.x);
    this.state.posKm.y = this.sceneToKm(this.camera.position.y);
    this.state.posKm.z = this.sceneToKm(this.camera.position.z);
  }

  private setFollowTarget(name: string) {
    if (name === "None") {
      this.followTargetObj = undefined;
      return;
    }
    this.followTargetObj = this.targets[name];
    if (name == "Earth"){
      this.state.followOffsetKm.z = 12000;
    }
    else if (name == "Moon"){
      this.state.followOffsetKm.z = 9000;
    }
    else {
      this.state.followOffsetKm.z =  200;
    }
    this.folder.controllersRecursive().forEach(c => c.updateDisplay());
    // set lookAt / optionally align controls.target
    if (this.followTargetObj && this.state.lookAtTarget) {
      this.controls.target.copy(this.followTargetObj.position);
    }
  }

  private applyPosKm() {
    this.camera.position.set(
      this.kmToSceneUnits(this.state.posKm.x),
      this.kmToSceneUnits(this.state.posKm.y),
      this.kmToSceneUnits(this.state.posKm.z)
    );
    // update orbitcontrols target if not following
    if (!this.followTargetObj) this.controls.update();
  }

  private resetPosition() {
    // mutate existing object fields instead of replacing object reference
    this.state.posKm.x = 0;
    this.state.posKm.y = 0;
    this.state.posKm.z = 20_000;

    // apply visually
    this.applyPosKm();

    // refresh GUI sliders to reflect the mutated values
    this.folder.controllersRecursive().forEach(c => c.updateDisplay());
  }


  public reset() {
    // reset camera to defaults
    this.camera.fov = 75;
    this.camera.near = 0.1;
    this.camera.far = 20000;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, this.kmToSceneUnits(20000));
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // reset GUI state — mutate fields (do NOT replace objects)
    this.state.fov = 75;
    this.state.near = 0.1;
    this.state.far = 20000;

    this.state.posKm.x = 0;
    this.state.posKm.y = 0;
    this.state.posKm.z = 20000;

    this.state.enableRotate= true,
    this.state.enablePan= true,
    this.state.enableZoom= true,
    this.state.rotateSpeed= 1.0,
    this.state.zoomSpeed= 1.0,
    this.state.panSpeed= 1.0,
    this.state.autoRotate= false,
    this.state.autoRotateSpeed= 2.0,

    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 1.0;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 2.0;


    // ensure the visual camera follows this numeric change
    this.applyPosKm();

    this.state.follow = "None";
    this.setFollowTarget("None");

    // mutate followOffsetKm fields instead of replacing object
    this.state.followOffsetKm.x = 0;
    this.state.followOffsetKm.y = 50;
    this.state.followOffsetKm.z = 200;
    
    this.state.followSmoothing = 0.12;
    this.state.lookAtTarget = true;

    // refresh ALL sliders/buttons, even nested ones
    this.folder.controllersRecursive().forEach(c => c.updateDisplay());
  }


  /** Call each frame. dt in seconds. */
  public update() {
    // If following a target, compute desired camera position and lerp
    if (this.followTargetObj) {
      const targetPos = this.followTargetObj.getWorldPosition(new THREE.Vector3());
      // desired camera = target + offset (convert offset km -> scene units)
      const offsetScene = new THREE.Vector3(
        this.kmToSceneUnits(this.state.followOffsetKm.x),
        this.kmToSceneUnits(this.state.followOffsetKm.y),
        this.kmToSceneUnits(this.state.followOffsetKm.z)
      );
      const desired = targetPos.clone().add(offsetScene);
      // smoothing: lerp from prevPos to desired
      const alpha = Math.max(0, Math.min(1, this.state.followSmoothing));
      this.prevPos.lerp(desired, alpha);
      this.camera.position.copy(this.prevPos);
      if (this.state.lookAtTarget) {
        this.controls.target.copy(targetPos);
        this.camera.lookAt(targetPos);
      }
      // update orbitcontrols internals so they don't snap
      this.controls.update();
      // reflect position into GUI sliders
      this.state.posKm.x = this.sceneToKm(this.camera.position.x);
      this.state.posKm.y = this.sceneToKm(this.camera.position.y);
      this.state.posKm.z = this.sceneToKm(this.camera.position.z);
      
    }
  }
}
