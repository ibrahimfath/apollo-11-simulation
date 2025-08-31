import * as THREE from "three";
import Stats  from "stats.js";
import { Earth } from "./objects/Earth";
import { Sun } from "./objects/Sun";
import { Moon } from "./objects/Moon";
import { createScene } from "./visualization/scene";
import { createControls } from "./visualization/controls";
import { createSkybox } from "./visualization/skybox";
import { TimeController } from "./physics/TimeController";
import { GuiManager } from "./ui/GuiManager";
import { GravityEngine } from "./physics/GravityEngine";
import { G } from "./physics/constants";
import { Barycenter } from "./physics/Barycenter";
import { createBloomPipeline } from "./visualization/bloom";
import { Spacecraft } from "./objects/Spacecraft";
import { SpacecraftPropagatorRK4 } from "./physics/SpacecraftPropagatorRK4";
import { SpacecraftGUI } from "./ui/SpacecraftGUI";
import { HohmannTransfer } from "./physics/HohmannTransfer";


const { scene, camera, renderer } = createScene();
const controls = createControls(camera, renderer);

const stats = new Stats();
stats.dom.style.position = "absolute";
stats.dom.style.top = "690px";
document.body.appendChild(stats.dom);

const bloomRenderer = createBloomPipeline(renderer, scene, camera, {
  strength: 2.0, // glow intensity
  radius: 0.5,   // glow spread
  threshold: 0.0 // brightness threshold
});

const earth = new Earth();
scene.add(earth.group);

const moon = new Moon();
scene.add(moon.group);
scene.add(moon.trail.object3d);

// real-world values
const mEarth = earth.mass; // 5.972e24
const mMoon  = moon.mass;  // 7.34767309e22
const r = 384_400_000;     // avg distance in meters

// place Earth and Moon so COM is near origin (optional)
const earthPos = new THREE.Vector3(- (mMoon / (mEarth + mMoon)) * r, 0, 0);
const moonPos  = new THREE.Vector3( (mEarth / (mEarth + mMoon)) * r, 0, 0);

// circular orbit speed for Moon around Earth (approx)
const vMoon = Math.sqrt(G * mEarth / r); // ~1022 m/s
// set directions: velocity perpendicular to position vector -> along +Y
// ?Momentum formula: 
// *momentum = mass × velocity
// !To conserve momentum, Earth must move slower than Moon (Earth's mass is much greater than Moon's)
const earthVel = new THREE.Vector3(0, -vMoon * (mMoon / mEarth), 0); // small opposite velocity
// Align Moon's velocity with the same orbital plane (Y-axis) for consistent barycentric motion
const moonVel  = new THREE.Vector3(0, vMoon, 0);

// set initial physics state
earth.setInitialState(earthPos, earthVel);
moon.setInitialState(moonPos, moonVel);

// create engine
const gravityEngine = new GravityEngine([earth, moon], 1e3);

// 6) Add Sun mesh (bloom)
const sun = new Sun();
scene.add(sun.group);


const spacecraft = new Spacecraft({});
scene.add(spacecraft.group);
scene.add(spacecraft.trail.object3d);


// Initial LEO state (circular ~300 km)
const r0 = earth.radius + 300_000;
const muEarth = G * earth.mass;
const vCirc = Math.sqrt(muEarth / r0);

const rVec = earth.r_m.clone().add(new THREE.Vector3(r0, 0, 0));
// Place spacecraft in Earth's orbital plane (XY) for coplanar Hohmann transfer
const vVec = earth.v_mps.clone().add(new THREE.Vector3(0, vCirc, 0));
spacecraft.setInitialState(rVec, vVec);

// RK4 propagator for spacecraft under Earth gravity (add Moon later)
const scProp = new SpacecraftPropagatorRK4({craft: spacecraft, primaries: [earth, moon], eps: 0, atmosphere: earth.atmosphere});

// Load and set skybox
const skyboxTexture = createSkybox("/textures/skybox/");
scene.background = skyboxTexture;

const time = new TimeController(10);
let last = performance.now();

// after you create earth, moon …
const bary = new Barycenter(earth, moon);
scene.add(bary.marker);

const hohmannTransfer = new HohmannTransfer(earth, moon, spacecraft);

const gui = new GuiManager(earth, moon, sun, time, bary, controls, camera, spacecraft);
const spacecraftUI = new SpacecraftGUI(spacecraft, earth.atmosphere, earth, hohmannTransfer);

function animate() {
  requestAnimationFrame(animate);

  stats.begin(); 

  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;

  dt = time.apply(dt);

  // integrate gravity (with substeps to keep dt stable)   
  gravityEngine.stepWithSubsteps(dt, 60); // max 60s per step

  earth.update(dt);
  moon.update(dt);
  
  bary.update();
  
  scProp.stepWithSubsteps(dt, 30);
  spacecraft.update();
  hohmannTransfer.update(dt);
  
  gui.updateAll();
  spacecraftUI.update();
  
  bloomRenderer.render();

  controls.update();
  stats.end()
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);
