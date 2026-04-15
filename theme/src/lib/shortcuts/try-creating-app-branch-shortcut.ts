import {
  AppBranchInfo,
  AppInfo,
  createShortcut,
  PROTOCOL_INFO,
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
    // Shortcut creation requires an icon. Consider adding a fallback icon URL if your app may not have one.
    if (appInfo.iconUrl === undefined) {
      return;
    }

    const protocolId = PROTOCOL_INFO.value?.id;

    if (protocolId === undefined) {
      return;
    }

    await createShortcut({
      shortcutPathTemplate: appBranchShortcutPathTemplate,
      shortcutIconSourceInfo: {
        type: ShortcutIconSourceType.UrlSource,
        url: appInfo.iconUrl,
      },
      shortcutUrl: `${protocolId}://start-app-branch-process?appId=${appInfo.id}&appBranchId=${appBranchInfo.id}`,
    });
  } catch (e) {
    console.error(e);
  }
}
