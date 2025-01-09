import {
  APP_MAIN_BRANCH_ID,
  AppBranchInfo,
  AppInfo,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";

import { getAppBranchLabel } from "./get-app-branch-label";

export function getAppLabel(
  {
    appInfo,
    appBranchInfo,
  }: {
    appInfo: AppInfo;
    appBranchInfo: AppBranchInfo;
  },
) {
  if (appBranchInfo.id === APP_MAIN_BRANCH_ID.value) {
    return appInfo.name ?? appInfo.id;
  }

  const appBranchLabel = getAppBranchLabel({
    appBranchInfo,
  });

  return `${appInfo.name} [${appBranchLabel}]`;
}
