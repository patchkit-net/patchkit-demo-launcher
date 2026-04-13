import {
  AppBranchInfo,
  AppInfo,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";

import { getAppBranchDesktopShortcutPathTemplate } from "./get-app-branch-desktop-shortcut-path-template";
import { IS_CREATING_START_MENU_SHORTCUT_SUPPORTED } from "./is-creating-start-menu-shortcut-supported";
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
  if (!IS_CREATING_START_MENU_SHORTCUT_SUPPORTED) {
    return;
  }

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
