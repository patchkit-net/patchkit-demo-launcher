import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import Unfonts from "unplugin-fonts/vite";
import UnpluginTypia from "@ryoppippi/unplugin-typia/vite";

export default defineConfig({
  base: ``,
  plugins: [
    UnpluginTypia({
      tsconfig: `tsconfig.app.json`,
    }),
    tsconfigPaths({}),
    TanStackRouterVite(),
    react(),
    VitePWA({
      workbox: {
        globPatterns: [
          `**/*`,
        ],
      },
      includeAssets: [
        `**/*`,
      ],
      manifest: {
        scope: `./`,
        start_url: `./`,
        theme_color: `#000000`,
      },
    }),
    Unfonts({
      google: {
        families: [
          {
            name: `Roboto`,
            styles: `ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900`,
            defer: false,
          },
          {
            name: `Roboto Condensed`,
            styles: `ital,wght@0,100..900;1,100..900`,
            defer: false,
          },
          {
            name: `Roboto Mono`,
            styles: `ital,wght@0,100..700;1,100..700`,
            defer: false,
          },
          {
            name: `Noto Sans`,
            styles: `ital,wdth,wght@0,62.5..100,100..900;1,62.5..100,100..900`,
            defer: false,
          },
        ],
      },
    })
  ],
  optimizeDeps: {
    include: [
      `@upsoft/patchkit-launcher-runtime-api-react-theme-client`,
      `@upsoft/patchkit-launcher-runtime-api-react-theme-extras`,
    ],
    force: true,
  },
  build: {
    chunkSizeWarningLimit: 5 * 1024,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [
        /node_modules/,
        /patchkit-api-foundation/,
        /patchkit-launcher-foundation/,
        /patchkit-launcher-runtime-api-foundation/,
        /patchkit-launcher-runtime-api-react-theme-client/,
        /patchkit-launcher-runtime-api-react-theme-extras/,
        /patchkit-launcher-runtime-api-theme-client/,
        /troy-foundation/,
        /troy-native-foundation/,
      ],
    },
  },
});
