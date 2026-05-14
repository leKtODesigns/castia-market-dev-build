import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  base: "/castia-market-dev-build/",
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "assets/js/*.js", dest: "assets/js" },
        { src: "assets/js/constants/*.js", dest: "assets/js/constants" },
        { src: "assets/js/pages/*.js", dest: "assets/js/pages" },
        { src: "assets/images/items", dest: "assets/images" },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        sellers: "sellers/index.html",
        sellersLegacy: "sellers.html",
        listingsAlias: "listings/index.html",
      },
    },
  },
});
