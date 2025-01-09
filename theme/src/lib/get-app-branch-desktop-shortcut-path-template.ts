import {
  AppBranchInfo,
  AppInfo,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";

import { getAppLabel } from "./get-app-label";

export function getAppBranchDesktopShortcutPathTemplate(
  {
    appInfo,
    appBranchInfo,
  }: {
    appInfo: AppInfo;
    appBranchInfo: AppBranchInfo;
  },
) {
  const appLabel = getAppLabel({
    appInfo,
    appBranchInfo,
  });

  return `{desktopDirPath}/${appLabel}`;
}
