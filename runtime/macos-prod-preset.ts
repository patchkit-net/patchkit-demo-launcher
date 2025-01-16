import * as PatchKitBasicLauncher from "@upsoft/patchkit-basic-launcher-runtime-package-dev-tools";

import { SHARED_PROD_BASE_PRESET } from "./shared-prod-base-preset";

export default PatchKitBasicLauncher.mergePartialPresets(
  PatchKitBasicLauncher.MACOS_BASE_PRESET.value,
  PatchKitBasicLauncher.mergePartialPresets(
    SHARED_PROD_BASE_PRESET,
    {
      secret: `c01c9927633a4eb5d34cec23403fa615`,
      iconFilePath: `./icons/macos.icns`,
      codeCertificate: {
        name: `Developer ID Application: Upsoft sp. z o. o. (VYL728DSU7)`,
      },
      appleTeamId: `VYL728DSU7`,
    },
  ),
) satisfies PatchKitBasicLauncher.Preset;
