import * as PatchKitBasicLauncher from "@upsoft/patchkit-basic-launcher-runtime-package-dev-tools";

import { SHARED_PROD_BASE_PRESET } from "./shared-prod-base-preset";

export default PatchKitBasicLauncher.mergePartialPresets(
  PatchKitBasicLauncher.WINDOWS_BASE_PRESET.value,
  PatchKitBasicLauncher.mergePartialPresets(
    SHARED_PROD_BASE_PRESET,
    {
      secret: `4cf675444d5c146202b57b1cc83c22cf`,
      iconFilePath: `./icons/windows.ico`,
      codeCertificate: {
        subjectName: `UPSOFT  sp. z o. o.`,
        sha1: `82A39608204521DF0E01EF28FC9229BFF6195F79`,
      },
    },
  ),
) satisfies PatchKitBasicLauncher.Preset;
