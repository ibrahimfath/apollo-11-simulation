import * as THREE from "three";
import { markForBloom } from "../visualization/bloom";


export class Sun {
  public light: THREE.DirectionalLight;
  public mesh: THREE.Mesh;
  public group: THREE.Group;

  constructor(){
    const detail = 7;
    const geometry = new THREE.IcosahedronGeometry(7, detail);
    const material = new THREE.MeshBasicMaterial({ color: "#FDB813" })

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 1000);
    markForBloom(this.mesh); // Sun glows
    
    this.light = new THREE.DirectionalLight(0xffffff, 3.0);
    this.light.position.set(0, 0, 130);

    this.group = new THREE.Group();
    
    this.group.add(this.mesh);
    this.group.add(this.light)
    }
}


