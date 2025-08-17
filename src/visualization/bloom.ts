import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// Which layer should glow
export const BLOOM_LAYER = 1;

// Internals
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_LAYER);

const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const originalMaterials = new Map<string, THREE.Material | THREE.Material[]>();

function darkenNonBloomed(obj: THREE.Object3D) {
  const mesh = obj as THREE.Mesh;
  if ((mesh as any).isMesh && mesh.material) {
    // If this object is NOT on the bloom layer, swap its material to black
    if (!mesh.layers.test(bloomLayer)) {
      originalMaterials.set(mesh.uuid, mesh.material);
      mesh.material = darkMaterial;
    }
  }
}

function restoreMaterial(obj: THREE.Object3D) {
  const mesh = obj as THREE.Mesh;
  if ((mesh as any).isMesh) {
    const mat = originalMaterials.get(mesh.uuid);
    if (mat) {
      mesh.material = mat;
      originalMaterials.delete(mesh.uuid);
    }
  }
}

/**
 * Mark an object (and all its children) as bloom-enabled.
 * NOTE: We "enable" the bloom layer so objects still remain visible to the camera's default layer 0.
 * Avoid using `layers.set(BLOOM_LAYER)`, which would remove them from layer 0.
 */
export function markForBloom(root: THREE.Object3D) {
  root.traverse((o) => o.layers.enable(BLOOM_LAYER));
}

/**
 * Build the selective bloom pipeline.
 * Call `render()` every frame instead of `renderer.render(...)`.
 * Call `setSize()` from your resize handler.
 */
export function createBloomPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options?: {
    strength?: number; // glow intensity
    radius?: number;   // glow spread
    threshold?: number;// brightness threshold
  }
) {
  const { strength = 2.0, radius = 0.5, threshold = 0.0 } = options || {};

  // Passes: base scene -> bloom (to offscreen target)
  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    strength,
    radius,
    threshold
  );

  // Composer that renders ONLY the bloom result
  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  // Final combine pass: base scene + bloom texture (additive)
  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          vec4 base = texture2D(baseTexture, vUv);
          vec4 bloom = texture2D(bloomTexture, vUv);
          gl_FragColor = base + bloom; // additive combine
        }
      `,
    }),
    "baseTexture"
  );
  finalPass.needsSwap = true;

  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  function render() {
    // 1) Render bloom-only pass by darkening everything not flagged for bloom
    scene.traverse(darkenNonBloomed);
    bloomComposer.render();
    scene.traverse(restoreMaterial);

    // 2) Render full scene + add bloom texture
    finalComposer.render();
  }

  function setSize(width: number, height: number, pixelRatio = window.devicePixelRatio) {
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(pixelRatio, 2));

    bloomComposer.setSize(width, height);
    finalComposer.setSize(width, height);
  }

  return {
    render,
    setSize,
    bloomPass,
    bloomComposer,
    finalComposer,
    BLOOM_LAYER,     // for convenience
    markForBloom,    // helper to tag objects
  };
}
