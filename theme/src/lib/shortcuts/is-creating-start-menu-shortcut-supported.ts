import {
  TARGET_OPERATING_SYSTEM_PLATFORM,
  TargetOperatingSystemPlatform,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";

export const IS_CREATING_START_MENU_SHORTCUT_SUPPORTED = TARGET_OPERATING_SYSTEM_PLATFORM.value === TargetOperatingSystemPlatform.Windows;
