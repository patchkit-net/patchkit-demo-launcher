import {
  AppBranchInfo,
  AppInfo,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";

import { getAppBranchDesktopShortcutPathTemplate } from "./get-app-branch-desktop-shortcut-path-template";
import { tryCreatingAppBranchShortcut } from "./try-creating-app-branch-shortcut";

export async function tryCreatingAppBranchDesktopShortcut(
  {
    appInfo,
    appBranchInfo,
  }: {
    appInfo: AppInfo;
    appBranchInfo: AppBranchInfo;
  },
) {
  const appBranchDesktopShortcutPathTemplate = getAppBranchDesktopShortcutPathTemplate({
    appInfo,
    appBranchInfo,
  });

  await tryCreatingAppBranchShortcut({
    appInfo,
    appBranchInfo,
    appBranchShortcutPathTemplate: appBranchDesktopShortcutPathTemplate,
  });
}
