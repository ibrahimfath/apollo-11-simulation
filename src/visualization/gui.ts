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
  // --- MOON FOLDER ---
  //
  const moonFolder = gui.addFolder("Moon");

  // Default moon values (used for reset)
  const defaultMoon = {
    mass: 7.34767309e22,
    radius: 1_737_400,
    rotationPeriod: 24, // hours (gui uses hours)
    totalRotationPeriod: 27.32 * 24 * 3600,
    axialTilt: 6.68,
    orbitRadius: 384_400_000,
    orbitPeriod: 27.32 * 24 * 3600,
    inclination: 5.145,
    bumpScale:
      moon.mesh.material instanceof THREE.MeshPhongMaterial
        ? moon.mesh.material.bumpScale
        : 0,
  };

  // Moon controllers
  const moonMassCtrl = moonFolder
    .add(moon, "mass", 7.34767309e22, 7.34767309e25)
    .name("Mass");

  const moonRotCtrl = moonFolder
    .add(moon, "rotationPeriod", 1, 100)
    .name("Rotation Period")
    .onChange((value: number) => {
      moon.rotationPeriod = value;
      moon.totalRotationPeriod = value * 3600;
    });

  const moonRadiusCtrl = moonFolder
    .add(moon, "radius", 1_000_000, 31_855_000)
    .name("Radius")
    .onChange((value: number) => {
      moon.setRadius(value);
    });

  const moonTiltCtrl = moonFolder
    .add(moon, "axialTilt", -45, 45)
    .name("Axial Tilt (°)")
    .onChange(() => {
      moon.group.rotation.z = -moon.axialTilt * Math.PI / 180;
    });

  // bumpScale controller (if available)
  let moonBumpCtrl: any = undefined;
  if (moon.mesh.material instanceof THREE.MeshPhongMaterial && moon.mesh.material.bumpMap) {
    moonBumpCtrl = moonFolder.add(moon.mesh.material, "bumpScale", 0, 5).name("Bump Scale");
  }

  // Orbit parameters (Orbit class has internal names; GUI uses 'as any' to avoid TS privacy)
  let moonOrbitRadiusCtrl: any;
  let moonOrbitPeriodCtrl: any;
  let moonInclinationCtrl: any;

  if (moon.orbit) {
    // Show orbit radius in meters in GUI, but Orbit stores scene units internally.
    // The onChange handler converts meters -> scene units.
    moonOrbitRadiusCtrl = moonFolder
      .add({ orbitRadius_m: defaultMoon.orbitRadius }, "orbitRadius_m", 100_000_000, 500_000_000)
      .name("Orbit Radius (m)")
      .onChange((value: number) => {
        // Convert meters -> scene units and assign to private field
        moon.orbit!["orbitRadius"] = value / (moon.scalePerUnit ?? 1_000_000);
      });

    // Orbit period controller (seconds)
    moonOrbitPeriodCtrl = moonFolder
      .add(moon.orbit as any, "orbitPeriod", 10 * 24 * 3600, 40 * 24 * 3600)
      .name("Orbit Period (s)");

    // Inclination in degrees toggle, convert to radians for internal storage
    moonInclinationCtrl = moonFolder
      .add({ inclination_deg: defaultMoon.inclination }, "inclination_deg", -10, 10)
      .name("Inclination (°)")
      .onChange((value: number) => {
        moon.orbit!["inclination"] = value * Math.PI / 180;
      });
  }

  // Reset Moon (synchronizes GUI controllers)
  moonFolder.add(
    {
      reset: () => {
        // Physical resets
        moon.mass = defaultMoon.mass;
        moon.setRadius(defaultMoon.radius);
        moon.rotationPeriod = defaultMoon.rotationPeriod;
        moon.totalRotationPeriod = defaultMoon.totalRotationPeriod;
        moon.axialTilt = defaultMoon.axialTilt;
        moon.group.rotation.z = -moon.axialTilt * Math.PI / 180;

        // Reset bump scale (if present)
        if (moon.mesh.material instanceof THREE.MeshPhongMaterial) {
          moon.mesh.material.bumpScale = defaultMoon.bumpScale;
        }

        // Reset orbit
        if (moon.orbit) {
          moon.orbit!["orbitRadius"] = defaultMoon.orbitRadius / (moon.scalePerUnit ?? 1_000_000);
          moon.orbit!["orbitPeriod"] = defaultMoon.orbitPeriod;
          moon.orbit!["inclination"] = defaultMoon.inclination * Math.PI / 180;
        }

        // Update GUI elements to reflect defaults
        moonMassCtrl.setValue(defaultMoon.mass);
        moonRadiusCtrl.setValue(defaultMoon.radius);
        moonRotCtrl.setValue(defaultMoon.rotationPeriod);
        moonTiltCtrl.setValue(defaultMoon.axialTilt);

        if (moonBumpCtrl) moonBumpCtrl.setValue(defaultMoon.bumpScale);

        if (moonOrbitRadiusCtrl) moonOrbitRadiusCtrl.setValue(defaultMoon.orbitRadius);
        if (moonOrbitPeriodCtrl) moonOrbitPeriodCtrl.setValue(defaultMoon.orbitPeriod);
        if (moonInclinationCtrl) moonInclinationCtrl.setValue(defaultMoon.inclination);
      },
    },
    "reset"
  ).name("Reset Moon");


  gui.close(); // start closed
}
