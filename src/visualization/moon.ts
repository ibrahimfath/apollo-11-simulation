import * as THREE from "three";

export function createMoon(): THREE.Group {
  const moonGroup = new THREE.Group();
  moonGroup.rotation.z = -23.4 * Math.PI / 180;

  const detail = 12;
  const loader = new THREE.TextureLoader();

  const geometry = new THREE.IcosahedronGeometry(2, detail);
  const moonMat = new THREE.MeshStandardMaterial({
    map: loader.load("/textures/moon/moonmap4k.jpg"),
    bumpMap: loader.load("/textures/moon/moonbump4k.jpg"),
    bumpScale: 5.05,
    roughness: 1.0,
    metalness: 0.0
    });
  const moonMesh = new THREE.Mesh(geometry, moonMat);
  moonMesh.name = "moonMesh"; // So we can access it later
  moonMesh.position.set(5, 0, 0);
  moonMesh.scale.setScalar(0.27);
  moonGroup.add(moonMesh);

  return moonGroup;
}
