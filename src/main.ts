import * as THREE from "three";
import { createScene } from "./visualization/scene";
import { createEarth } from "./visualization/earth";
import { createControls } from "./visualization/controls";
import { createSunLight } from "./visualization/lighting";

const { scene, camera, renderer } = createScene();
const controls = createControls(camera, renderer);

const earthGroup = createEarth();
scene.add(earthGroup);

const sunLight = createSunLight();
scene.add(sunLight);

const cloudsMesh = earthGroup.getObjectByName("cloudsMesh") as THREE.Mesh;



function animate() {
  requestAnimationFrame(animate);
  
  earthGroup.rotation.y += 0.002;
  cloudsMesh.rotation.y += 0.001;
  
  renderer.render(scene, camera);
  controls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);
