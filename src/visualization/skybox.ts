import * as THREE from "three";

export function createSkybox(path: string, loaderManager?: THREE.LoadingManager): THREE.CubeTexture {
  const loader = new THREE.CubeTextureLoader(loaderManager);
  let format = ".png";
  const texture = loader.load([
    `${path}px${format}`, // +X
    `${path}nx${format}`, // -X
    `${path}py${format}`, // +Y
    `${path}ny${format}`, // -Y
    `${path}pz${format}`, // +Z
    `${path}nz${format}`  // -Z
  ]);

//   texture.encoding = THREE.sRGBEncoding; // Keep colors correct
  return texture;
}
