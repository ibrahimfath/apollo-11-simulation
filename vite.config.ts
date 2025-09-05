import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  base: '/apollo-11-simulation/',
  plugins: [glsl()],
});
