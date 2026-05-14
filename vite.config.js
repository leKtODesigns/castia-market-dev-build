import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  base: "/castia-market-dev-build/",
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "assets/js/**/*", dest: "assets/js", structured: true },
        { src: "assets/images/**/*", dest: "assets/images", structured: true },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        sellers: "sellers.html",
      },
    },
  },
});
