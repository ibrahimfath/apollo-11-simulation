import * as THREE from "three";
import { getatmosphereMat } from "./atmosphere";

export function createEarth(): THREE.Group {
  const earthGroup = new THREE.Group();
  earthGroup.rotation.z = -23.4 * Math.PI / 180;

  const detail = 12;
  const loader = new THREE.TextureLoader();

  const geometry = new THREE.IcosahedronGeometry(2, detail);
  const material = new THREE.MeshPhongMaterial({
    map: loader.load("textures/earth/8k_earth_daymap.jpg"),
    specularMap: loader.load("/textures/earth/8k_earth_specular_map.jpg"),
  });

  const earthMesh = new THREE.Mesh(geometry, material);
  earthMesh.name = "earthMesh"; // So we can access it later
  earthGroup.add(earthMesh);

  //clouds
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load("textures/earth/8k_earth_clouds.jpg"),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  })
  const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
  cloudsMesh.name = "cloudsMesh";
  cloudsMesh.scale.setScalar(1.003);
  earthGroup.add(cloudsMesh);

  //atmosphere
  const atmosphereMat = getatmosphereMat();
  const glowMesh = new THREE.Mesh(geometry, atmosphereMat);
  glowMesh.scale.setScalar(1.01);
  earthGroup.add(glowMesh);

  return earthGroup;
}
