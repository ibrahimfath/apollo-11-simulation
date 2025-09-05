import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/apollo-11-simulation/' : '',
  plugins: [glsl()],
});
