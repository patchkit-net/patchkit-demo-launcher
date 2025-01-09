import * as PatchKitGenericLauncher from "@upsoft/patchkit-generic-launcher-runtime-package-dev-tools";

import { SHARED_PROD_BASE_PRESET } from "./shared-prod-base-preset";

export default PatchKitGenericLauncher.mergePartialPresets(
  PatchKitGenericLauncher.LINUX_BASE_PRESET.value,
  PatchKitGenericLauncher.mergePartialPresets(
    SHARED_PROD_BASE_PRESET,
    {
      secret: `f2faa7122991f51911f955046ca709ef`,
      iconFilePath: `./icons/linux.png`,
    },
  ),
) satisfies PatchKitGenericLauncher.Preset;

