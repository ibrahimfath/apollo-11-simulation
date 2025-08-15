import { Earth } from "./objects/Earth";
import { Sun } from "./objects/Sun";
import { Moon } from "./objects/Moon";
import { createScene } from "./visualization/scene";
import { createControls } from "./visualization/controls";
import { createSkybox } from "./visualization/skybox";
import { createBloomPipeline} from "./visualization/bloom";
import { TimeController } from "./physics/TimeController";
import { setupGUI } from "./ui/guiManager";


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

// 6) Add Sun mesh (bloom)
const sun = new Sun();
scene.add(sun.mesh);
scene.add(sun.light);

// Load and set skybox
const skyboxTexture = createSkybox("/textures/skybox/");
scene.background = skyboxTexture;

const time = new TimeController(3000);
let last = performance.now();

setupGUI(earth, moon, sun,time); 

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;

  dt = time.apply(dt);

  earth.update(dt);
  moon.update(dt);

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
