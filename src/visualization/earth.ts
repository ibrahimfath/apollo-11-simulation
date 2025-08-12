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
    bumpMap: loader.load("textures/earth/01_earthbump1k.jpg"),
    bumpScale: 0.04,
  });

  const earthMesh = new THREE.Mesh(geometry, material);
  earthMesh.name = "earthMesh"; // So we can access it later
  earthGroup.add(earthMesh);

  const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load("textures/earth/04_earthcloudmap.jpg"),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    alphaMap: loader.load("textures/earth/05_earthcloudmaptrans.jpg"),
    // alphaTest: 0.3,
  })

  const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
  cloudsMesh.name = "cloudsMesh";
  cloudsMesh.scale.setScalar(1.003);
  earthGroup.add(cloudsMesh);

  return earthGroup;
}
