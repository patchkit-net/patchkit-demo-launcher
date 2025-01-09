import * as PatchKitGenericLauncher from "@upsoft/patchkit-generic-launcher-runtime-package-dev-tools";

import { SHARED_PROD_BASE_PRESET } from "./shared-prod-base-preset";

export default PatchKitGenericLauncher.mergePartialPresets(
  PatchKitGenericLauncher.WINDOWS_BASE_PRESET.value,
  PatchKitGenericLauncher.mergePartialPresets(
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
) satisfies PatchKitGenericLauncher.Preset;
