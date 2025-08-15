import * as THREE from "three";
import { markForBloom } from "../visualization/bloom";


export class Sun {
  public light: THREE.DirectionalLight;
  public mesh: THREE.Mesh;

  constructor(){
    const detail = 12;
    const geometry = new THREE.IcosahedronGeometry(7, detail);
    const material = new THREE.MeshBasicMaterial({ color: "#FDB813" })

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 700);
    this.light = new THREE.DirectionalLight(0xffffff, 3.0);
    this.light.position.set(0, 0, 130);
    
    markForBloom(this.mesh); // Sun glows
    }
}


