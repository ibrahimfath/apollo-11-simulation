import { GUI } from "lil-gui";
import * as THREE from "three";
import { Moon } from "../objects/Moon";
import type { CelestialBody } from "../objects/CelestialBody";

export function createMoonControls(gui: GUI, moon: Moon, earth: CelestialBody) {
  const folder = gui.addFolder("Moon");

  const defaults = {
    mass: 7.34767309e22,
    radius: 1_737_400,
    rotationPeriod: 24,
    totalRotationPeriod: 27.32 * 24 * 3600,
    axialTilt: 6.68,
    orbitRadius: 384_400_000,
    orbitPeriod: 27.32 * 24 * 3600,
    inclination: 5.145,
    bumpScale: moon.mesh.material instanceof THREE.MeshPhongMaterial
      ? moon.mesh.material.bumpScale : 0,
  };

  const massCtrl = folder.add(moon, "mass", 1e10, 1e25).name("Mass");
  const rotCtrl = folder.add(moon, "rotationPeriod", 1, 100).name("Rotation Period")
    .onChange((v: number) => {
      moon.rotationPeriod = v;
      moon.totalRotationPeriod = v * 3600;
    });

  const radiusCtrl = folder.add(moon, "radius", 1_000_000, 31_855_000).name("Radius")
    .onChange((v: number) => moon.setRadius(v));

  const tiltCtrl = folder.add(moon, "axialTilt", -45, 45).name("Axial Tilt (°)")
    .onChange(() => {
      moon.group.rotation.z = -moon.axialTilt * Math.PI / 180;
    });

  let bumpCtrl: any;
  if (moon.mesh.material instanceof THREE.MeshPhongMaterial && moon.mesh.material.bumpMap) {
    bumpCtrl = folder.add(moon.mesh.material, "bumpScale", 0, 5).name("Bump Scale");
  }
  const physicsState = {
    pos: "(0,0,0)",
    vel: "(0,0,0)",
    acc: "(0,0,0)",
    // distanceToEarth: "0 m"
  };

  folder.add(physicsState, "pos").name("Position (m)");
  folder.add(physicsState, "vel").name("Velocity (m/s)");
  folder.add(physicsState, "acc").name("Accel (m/s²)");
  // folder.add(physicsState, "distanceToEarth").name("Earth Distance (m)");

  // Expose update hook so you can call it each frame
  function updatePhysicsUI() {
    physicsState.pos = `(${moon.r_m.x.toFixed(2)}, ${moon.r_m.y.toFixed(2)}, ${moon.r_m.z.toFixed(2)})`;
    physicsState.vel = `(${moon.v_mps.x.toFixed(2)}, ${moon.v_mps.y.toFixed(2)}, ${moon.v_mps.z.toFixed(2)})`;
    physicsState.acc = `(${moon.a_mps2.x.toFixed(4)}, ${moon.a_mps2.y.toFixed(4)}, ${moon.a_mps2.z.toFixed(4)})`;

    // const dist = moon.r_m.clone().sub(earth.r_m).length();
    // physicsState.distanceToEarth = `${dist.toExponential(3)} m`;
    // Refresh GUI manually
    folder.controllers.forEach(ctrl => ctrl.updateDisplay());
  }

  folder.add({ reset: () => {
      moon.mass = defaults.mass;
      moon.setRadius(defaults.radius);
      moon.rotationPeriod = defaults.rotationPeriod;
      moon.totalRotationPeriod = defaults.totalRotationPeriod;
      moon.axialTilt = defaults.axialTilt;
      moon.group.rotation.z = -defaults.axialTilt * Math.PI / 180;

      if (moon.mesh.material instanceof THREE.MeshPhongMaterial) {
        moon.mesh.material.bumpScale = defaults.bumpScale;
      }

      massCtrl.setValue(defaults.mass);
      radiusCtrl.setValue(defaults.radius);
      rotCtrl.setValue(defaults.rotationPeriod);
      tiltCtrl.setValue(defaults.axialTilt);

      if (bumpCtrl) bumpCtrl.setValue(defaults.bumpScale);
    }
  }, "reset").name("Reset Moon");
  return {
    folder,
    updatePhysicsUI,
    reset: () => {
        const ctrl = folder.controllers.find(c => c.property === "reset");
        (ctrl?.object as { reset: () => void })?.reset();
    }
  };
}
