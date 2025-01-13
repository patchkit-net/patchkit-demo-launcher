import * as PatchKitBasicLauncher from "@upsoft/patchkit-basic-launcher-runtime-package-dev-tools";

import { SHARED_PROD_BASE_PRESET } from "./shared-prod-base-preset";

export default PatchKitBasicLauncher.mergePartialPresets(
  PatchKitBasicLauncher.LINUX_BASE_PRESET.value,
  PatchKitBasicLauncher.mergePartialPresets(
    SHARED_PROD_BASE_PRESET,
    {
      secret: `f2faa7122991f51911f955046ca709ef`,
      iconFilePath: `./icons/linux.png`,
    },
  ),
) satisfies PatchKitBasicLauncher.Preset;

