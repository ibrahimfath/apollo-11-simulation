import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

export function createControls(camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
  return new OrbitControls(camera, renderer.domElement);
}
