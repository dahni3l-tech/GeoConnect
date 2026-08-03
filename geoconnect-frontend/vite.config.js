import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "auto",

      includeAssets: ["favicon.svg", "icons.svg"],

      manifest: {
        name: "GeoConnect",
        short_name: "GeoConnect",
        description: "GeoConnect - Share your location with friends",
        theme_color: "#863bff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        icons: [
          {
            src: "favicon.svg",
            sizes: "48x46",
            type: "image/svg+xml",
          },
          {
            src: "icons.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },

      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,gif,ico}"],
      },
    }),
  ],
});