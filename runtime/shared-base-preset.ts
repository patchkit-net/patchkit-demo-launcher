import * as PatchKitBasicLauncher from "@upsoft/patchkit-basic-launcher-runtime-package-dev-tools";

export const SHARED_BASE_PRESET = {
  companyId: `upsoft`,
  companyName: `Upsoft`,
  window: {
    iconFileAssetId: `icon`,
    defaultSize: {
      width: 1280,
      height: 720,
    },
    defaultMinSize: undefined,
    defaultMaxSize: undefined,
    defaultIsResizable: true,
    isBorderless: true,
  },
  assets: {
    [`icon`]: {
      path: `./assets/icon.png`,
    },
  },
  protocol: {},
  tray: {
    /*
     * With no tray.iconFileAssetId the tray falls back to window.iconFileAssetId, so this
     * applies to ./assets/icon.png. macOS renders a template image from the alpha channel
     * alone and discards every colour, which suits that file because it is a single-colour
     * silhouette. Replacing it with a full-colour icon means dropping this flag, or
     * pointing tray.iconFileAssetId at a separate silhouette asset.
     */
    isTemplateImage: true,
  },
} satisfies PatchKitBasicLauncher.PartialPreset;
