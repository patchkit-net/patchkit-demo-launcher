import * as PatchKitGenericLauncher from "@upsoft/patchkit-generic-launcher-runtime-package-dev-tools";

import { SHARED_PROD_BASE_PRESET } from "./shared-prod-base-preset";

export default PatchKitGenericLauncher.mergePartialPresets(
  PatchKitGenericLauncher.MACOS_BASE_PRESET.value,
  PatchKitGenericLauncher.mergePartialPresets(
    SHARED_PROD_BASE_PRESET,
    {
      secret: `c01c9927633a4eb5d34cec23403fa615`,
      iconFilePath: `./icons/macos.icns`,
      appleTeamId: `VYL728DSU7`,
    },
  ),
) satisfies PatchKitGenericLauncher.Preset;
