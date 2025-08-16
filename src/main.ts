import * as THREE from "three";
import { Earth } from "./objects/Earth";
import { Sun } from "./objects/Sun";
import { Moon } from "./objects/Moon";
import { createScene } from "./visualization/scene";
import { createControls } from "./visualization/controls";
import { createSkybox } from "./visualization/skybox";
import { createBloomPipeline} from "./visualization/bloom";
import { TimeController } from "./physics/TimeController";
import { setupGUI } from "./ui/guiManager";
import { GravityEngine } from "./physics/GravityEngine";
import { G } from "./physics/constants";
import { Barycenter } from "./physics/Barycenter";


const { scene, camera, renderer } = createScene();
const controls = createControls(camera, renderer);


const bloomRenderer = createBloomPipeline(renderer, scene, camera, {
  strength: 2.0, // glow intensity
  radius: 0.5,   // glow spread
  threshold: 0.0 // brightness threshold
});

const earth = new Earth();
scene.add(earth.group);

const moon = new Moon(earth);
scene.add(moon.group);

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
const earthVel = new THREE.Vector3(0, -vMoon * (mMoon / mEarth), 0); // small opposite velocity
const moonVel  = new THREE.Vector3(0, vMoon, 0);

// set initial physics state
earth.setInitialState(earthPos, earthVel);
moon.setInitialState(moonPos, moonVel);

// create engine
const gravityEngine = new GravityEngine([earth, moon], 1e3);

// 6) Add Sun mesh (bloom)
const sun = new Sun();
scene.add(sun.mesh);
scene.add(sun.light);

// Load and set skybox
const skyboxTexture = createSkybox("/textures/skybox/");
scene.background = skyboxTexture;

const time = new TimeController(1);
let last = performance.now();

// after you create earth, moon …
const bary = new Barycenter(earth, moon);
scene.add(bary.marker);

const { gui, timeUI, earthMoonUI, earthUI, moonUI, sunUI } = setupGUI(earth, moon, sun, time, bary);

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;

  dt = time.apply(dt);

  // integrate gravity (with substeps to keep dt stable)   
  gravityEngine.stepWithSubsteps(dt, 60); // max 60s per step

  earth.update(dt);
  moon.update(dt);

  moonUI.updatePhysicsUI();

  bary.update();
  earthMoonUI.update();
  
  // Render with bloom
  bloomRenderer.render();

  controls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);
