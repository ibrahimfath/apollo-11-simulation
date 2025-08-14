// src/visualization/gui.ts
import * as THREE from "three";
import GUI from "lil-gui";
import { Earth } from "./Earth";
import { Moon } from "./Moon";
import { TimeController } from "../physics/TimeController";

export function setupGUI(earth: Earth, moon: Moon, time: TimeController) {
  const gui = new GUI();
  
  //
  // --- TIME FOLDER ---
  //
  const timeFolder = gui.addFolder("Time");
  
  const defaultTime = {
    scale: time.scale,
  };
  
  const timeScaleCtrl = timeFolder.add(time, "scale", 0.1, 10000).name("Time Scale");
  
  // Reset time button (also resets GUI)
  timeFolder.add(
    {
      reset: () => {
        time.setScale(defaultTime.scale);
        timeScaleCtrl.setValue(defaultTime.scale);
      },
    },
    "reset"
  ).name("Reset Time");
  //
  // --- EARTH FOLDER ---
  //
  const earthFolder = gui.addFolder("Earth");

  // Default values for reset
  const defaultEarth = {
    mass: 5.972e24,
    radius: 6_371_000,
    axialTilt: 23.4,
    rotationPeriod: 23.93, // hours (matches how GUI uses it)
    cloudOpacity: 0.8,
    wireframe: (earth.mesh.material as THREE.MeshPhongMaterial).wireframe ?? false,
  };

  // Controllers (saved so we can setValue on reset)
  const earthMassCtrl = earthFolder.add(earth, "mass", 5.972e24, 5.972e+26).name("Mass");
  const earthRadiusCtrl = earthFolder
    .add(earth, "radius", 1_000_000, 31_855_000)
    .name("Radius")
    .onChange((value: number) => {
      earth.setRadius(value);
    });

  const earthTiltCtrl = earthFolder
    .add(earth, "axialTilt", -45, 45)
    .name("Axial Tilt (°)")
    .onChange(() => {
      earth.group.rotation.z = -earth.axialTilt * Math.PI / 180;
    });

  const earthRotCtrl = earthFolder
    .add(earth, "rotationPeriod", 1, 100)
    .name("Rotation Period")
    .onChange((value: number) => {
      earth.rotationPeriod = value;
      earth.totalRotationPeriod = value * 3600;
    });

  // Cloud opacity (cast material)
  const cloudsMat = earth.clouds!.material as THREE.MeshStandardMaterial;
  const cloudOpacityCtrl = earthFolder
    .add(cloudsMat, "opacity", 0, 1)
    .name("Cloud Opacity");

  // Wireframe toggle
  const earthMeshMat = earth.mesh.material as THREE.MeshPhongMaterial;
  const wireframeCtrl = earthFolder
    .add(earthMeshMat, "wireframe")
    .name("Wireframe");

  // Toggle clouds button
  earthFolder.add(
    {
      toggleClouds: () => {
        earth.clouds!.visible = !earth.clouds!.visible;
      },
    },
    "toggleClouds"
  ).name("Toggle Clouds");

  // Reset Earth (also updates GUI controllers)
  earthFolder.add(
    {
      reset: () => {
        // Restore earth properties
        earth.setRadius(defaultEarth.radius);
        earth.axialTilt = defaultEarth.axialTilt;
        earth.mass = defaultEarth.mass;
        earth.group.rotation.z = -earth.axialTilt * Math.PI / 180;
        earth.rotationPeriod = defaultEarth.rotationPeriod;
        earth.totalRotationPeriod = defaultEarth.rotationPeriod * 3600;

        // Restore cloud material
        cloudsMat.opacity = defaultEarth.cloudOpacity;

        // Restore wireframe
        earthMeshMat.wireframe = defaultEarth.wireframe;

        // Update GUI controls visually
        earthMassCtrl.setValue(defaultEarth.mass);
        earthRadiusCtrl.setValue(defaultEarth.radius);
        earthTiltCtrl.setValue(defaultEarth.axialTilt);
        earthRotCtrl.setValue(defaultEarth.rotationPeriod);
        cloudOpacityCtrl.setValue(defaultEarth.cloudOpacity);
        wireframeCtrl.setValue(defaultEarth.wireframe);
      },
    },
    "reset"
  ).name("Reset Earth");

  //
  // --- ATMOSPHERE SUB-FOLDER (under Earth) ---
  //
  const atmosphereFolder = earthFolder.addFolder("Atmosphere");

  // Defaults
  const defaultAtmos = {
    rimHex: 0x0088ff,
    facingHex: 0x000000,
    bias: 0.1,
    scale: 0.27,
    power: 5.0,
  };

  // Color pickers
  const rimColorCtrl = atmosphereFolder
    .addColor(earth.atmosphere, "rimHex")
    .name("Rim Color")
    .onChange((value: number) => {
      (earth.atmosphere.material!.uniforms.color1.value as THREE.Color).setHex(value);
    });

  const facingColorCtrl = atmosphereFolder
    .addColor(earth.atmosphere, "facingHex")
    .name("Facing Color")
    .onChange((value: number) => {
      (earth.atmosphere.material!.uniforms.color2.value as THREE.Color).setHex(value);
    });

  // Numeric uniforms (ensure typed callbacks)
  const biasCtrl = atmosphereFolder
    .add(earth.atmosphere, "bias", 0, 1)
    .name("Atmosphere Bias")
    .onChange((v: number) => {
      earth.atmosphere.material!.uniforms.atmosphereBias.value = v;
    });

  const scaleCtrl = atmosphereFolder
    .add(earth.atmosphere, "scale", 0, 1)
    .name("Atmosphere Scale")
    .onChange((v: number) => {
      earth.atmosphere.material!.uniforms.atmosphereScale.value = v;
    });

  const powerCtrl = atmosphereFolder
    .add(earth.atmosphere, "power", 0, 10)
    .name("Atmosphere Power")
    .onChange((v: number) => {
      earth.atmosphere.material!.uniforms.atmospherePower.value = v;
    });

  // Atmosphere Reset (also updates GUI)
  atmosphereFolder.add(
    {
      reset: () => {
        (earth.atmosphere.material!.uniforms.color1.value as THREE.Color).setHex(defaultAtmos.rimHex);
        (earth.atmosphere.material!.uniforms.color2.value as THREE.Color).setHex(defaultAtmos.facingHex);
        earth.atmosphere.material!.uniforms.atmosphereBias.value = defaultAtmos.bias;
        earth.atmosphere.material!.uniforms.atmosphereScale.value = defaultAtmos.scale;
        earth.atmosphere.material!.uniforms.atmospherePower.value = defaultAtmos.power;

        // Also update the bound object values so GUI shows consistent values
        earth.atmosphere.rimHex = defaultAtmos.rimHex;
        earth.atmosphere.facingHex = defaultAtmos.facingHex;
        earth.atmosphere.bias = defaultAtmos.bias;
        earth.atmosphere.scale = defaultAtmos.scale;
        earth.atmosphere.power = defaultAtmos.power;

        rimColorCtrl.setValue(defaultAtmos.rimHex);
        facingColorCtrl.setValue(defaultAtmos.facingHex);
        biasCtrl.setValue(defaultAtmos.bias);
        scaleCtrl.setValue(defaultAtmos.scale);
        powerCtrl.setValue(defaultAtmos.power);
      },
    },
    "reset"
  ).name("Reset Atmosphere");

  // 

  gui.close(); // start closed
}
