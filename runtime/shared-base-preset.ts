import * as PatchKitGenericLauncher from "@upsoft/patchkit-generic-launcher-runtime-package-dev-tools";

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
  tray: {},
} satisfies PatchKitGenericLauncher.PartialPreset;
