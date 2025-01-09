import { AppBranchInfo } from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";

export function getAppBranchLabel(
  {
    appBranchInfo,
  }: {
    appBranchInfo: AppBranchInfo;
  },
) {
  return appBranchInfo.name ?? appBranchInfo.id;
}
