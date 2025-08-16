import { GUI } from "lil-gui";
import * as THREE from "three";
import { Moon } from "../objects/Moon";

export function createMoonControls(gui: GUI, moon: Moon) {
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

  const massCtrl = folder.add(moon, "mass", 7.34767309e22, 7.34767309e25).name("Mass");
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

  let orbitRadiusCtrl: any;
  let orbitPeriodCtrl: any;
  let inclinationCtrl: any;

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
      if (orbitRadiusCtrl) orbitRadiusCtrl.setValue(defaults.orbitRadius);
      if (orbitPeriodCtrl) orbitPeriodCtrl.setValue(defaults.orbitPeriod);
      if (inclinationCtrl) inclinationCtrl.setValue(defaults.inclination);
    }
  }, "reset").name("Reset Moon");
  return {
    folder,
    reset: () => {
        const ctrl = folder.controllers.find(c => c.property === "reset");
        (ctrl?.object as { reset: () => void })?.reset();
    }
  };
}
