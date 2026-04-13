import {
  AppBranchInfo,
  AppInfo,
  createShortcut,
  ID,
  ShortcutIconSourceType,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";

export async function tryCreatingAppBranchShortcut(
  {
    appInfo,
    appBranchInfo,
    appBranchShortcutPathTemplate,
  }: {
    appInfo: AppInfo;
    appBranchInfo: AppBranchInfo;
    appBranchShortcutPathTemplate: string;
  },
) {
  try {
    if (appInfo.iconUrl === undefined) {
      return;
    }

    await createShortcut({
      shortcutPathTemplate: appBranchShortcutPathTemplate,
      shortcutIconSourceInfo: {
        type: ShortcutIconSourceType.UrlSource,
        url: appInfo.iconUrl,
      },
      shortcutUrl: `${ID.value}://start-app-branch-process?appId=${appInfo.id}&appBranchId=${appBranchInfo.id}`,
    });
  } catch (e) {
    console.error(e);
  }
}
