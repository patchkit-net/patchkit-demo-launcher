import * as PatchKitBasicLauncher from "@upsoft/patchkit-basic-launcher-runtime-package-dev-tools";

import { SHARED_BASE_PRESET } from "./shared-base-preset";

export const SHARED_PROD_BASE_PRESET = PatchKitBasicLauncher.mergePartialPresets(
  SHARED_BASE_PRESET,
  {
    id: `patchkit-demo-launcher`,
    name: `PatchKit Demo Launcher`,
    description: `PatchKit Demo Launcher`,
    appsCatalogId: `b01e44e8-6f2e-487b-9869-f014863f2a7a`,
    protocol: {
      id: "patchkit-demo-launcher",
    },
  } satisfies PatchKitBasicLauncher.PartialPreset,
);
