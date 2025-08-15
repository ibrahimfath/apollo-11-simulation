import { GUI } from "lil-gui";
import * as THREE from "three";
import { Earth } from "../objects/Earth";
import { createAtmosphereControls } from "./atmosphereControls";

export function createEarthControls(gui: GUI, earth: Earth) {
  const folder = gui.addFolder("Earth");

  const defaults = {
    mass: 5.972e24,
    radius: 6_371_000,
    axialTilt: 23.4,
    rotationPeriod: 23.93,
    cloudOpacity: 0.8,
    wireframe: (earth.mesh.material as THREE.MeshPhongMaterial).wireframe ?? false,
  };

  const massCtrl = folder.add(earth, "mass", 5.972e24, 5.972e+26).name("Mass");
  const radiusCtrl = folder.add(earth, "radius", 1_000_000, 31_855_000)
    .name("Radius")
    .onChange((v: number) => earth.setRadius(v));

  const tiltCtrl = folder.add(earth, "axialTilt", -45, 45)
    .name("Axial Tilt (°)")
    .onChange(() => {
      earth.group.rotation.z = -earth.axialTilt * Math.PI / 180;
    });

  const rotCtrl = folder.add(earth, "rotationPeriod", 1, 100)
    .name("Rotation Period")
    .onChange((v: number) => {
      earth.rotationPeriod = v;
      earth.totalRotationPeriod = v * 3600;
    });

  const cloudsMat = earth.clouds!.material as THREE.MeshStandardMaterial;
  const cloudOpacityCtrl = folder.add(cloudsMat, "opacity", 0, 1).name("Cloud Opacity");

  const earthMat = earth.mesh.material as THREE.MeshPhongMaterial;
  const wireframeCtrl = folder.add(earthMat, "wireframe").name("Wireframe");

  folder.add({ toggleClouds: () => {
      earth.clouds!.visible = !earth.clouds!.visible;
    }
  }, "toggleClouds").name("Toggle Clouds");

  const atmosphere = createAtmosphereControls(folder, earth.atmosphere);

  folder.add({ reset: () => {
      earth.setRadius(defaults.radius);
      earth.axialTilt = defaults.axialTilt;
      earth.mass = defaults.mass;
      earth.group.rotation.z = -defaults.axialTilt * Math.PI / 180;
      earth.rotationPeriod = defaults.rotationPeriod;
      earth.totalRotationPeriod = defaults.rotationPeriod * 3600;
      cloudsMat.opacity = defaults.cloudOpacity;
      earthMat.wireframe = defaults.wireframe;

      massCtrl.setValue(defaults.mass);
      radiusCtrl.setValue(defaults.radius);
      tiltCtrl.setValue(defaults.axialTilt);
      rotCtrl.setValue(defaults.rotationPeriod);
      cloudOpacityCtrl.setValue(defaults.cloudOpacity);
      wireframeCtrl.setValue(defaults.wireframe);

      atmosphere.reset();
    }
  }, "reset").name("Reset Earth");

  return {
    folder,
    reset: () => {
        const ctrl = folder.controllers.find(c => c.property === "reset");
        (ctrl?.object as { reset: () => void })?.reset();
    }
  };
}
