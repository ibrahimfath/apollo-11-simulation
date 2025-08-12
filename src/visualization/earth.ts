import * as THREE from "three";

export function createEarth(): THREE.Group {
  const earthGroup = new THREE.Group();
  earthGroup.rotation.z = -23.4 * Math.PI / 180;

  const detail = 12;
  const loader = new THREE.TextureLoader();

  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const material = new THREE.MeshPhongMaterial({
    map: loader.load("/textures/earth/00_earthmap1k.jpg"),
    specularMap: loader.load("/textures/earth/02_earthspec1k.jpg"),
    bumpMap: loader.load("/textures/earth/earthbump1k.jpg"),
    bumpScale: 0.04,
  });

  const earthMesh = new THREE.Mesh(geometry, material);
  earthMesh.name = "earthMesh"; // So we can access it later
  earthGroup.add(earthMesh);

  return earthGroup;
}
