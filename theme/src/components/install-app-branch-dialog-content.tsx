import {
  AppBranchInfo,
  AppInfo,
  displaySelectAppBranchRootDirDialog,
  useAppBranchDefaultRootDirPath,
  useAppBranchLatestVersionId,
  useAppBranchVersionInfo,
  useDirDiskFreeSpaceBytesCountQuery,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import { FolderEditIcon } from "lucide-react";
import {
  Suspense,
  useState,
} from "react";

import { getAppLabel } from "@/lib/get-app-label";
import { IS_CREATING_START_MENU_SHORTCUT_SUPPORTED } from "@/lib/is-creating-start-menu-shortcut-supported";
import { tryCreatingAppBranchDesktopShortcut } from "@/lib/try-creating-app-branch-desktop-shortcut";
import { tryCreatingAppBranchStartMenuShortcut } from "@/lib/try-creating-app-branch-start-menu-shortcut";

import { SpinnerLayout } from "./spinner-layout";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Spinner } from "./ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { TypographyInlineCode } from "./ui/typography-inline-code";
import { TypographyMuted } from "./ui/typography-muted";
import { TypographySmall } from "./ui/typography-small";
import { AppNotRegisteredBranchController } from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";

function getBytesCountLabel(bytesCount: number): string {
  if (bytesCount > 1024 * 1024 * 1024) {
    return `${(bytesCount / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  } else {
    return `${(bytesCount / (1024 * 1024)).toFixed(2)} MB`;
  }
}

function InstallAppBranchDialogSuspenseContent(
  {
    appInfo,
    appBranchInfo,
    appBranchController,
  }: {
    appInfo: AppInfo;
    appBranchInfo: AppBranchInfo;
    appBranchController: AppNotRegisteredBranchController;
  },
) {
  const appBranchLatestVersionId = useAppBranchLatestVersionId({
    appId: appInfo.id,
    appBranchId: appBranchInfo.id,
  });

  const appBranchLatestVersionInfo = useAppBranchVersionInfo({
    appId: appInfo.id,
    appBranchId: appBranchInfo.id,
    appBranchVersionId: appBranchLatestVersionId,
  });

  const appBranchDefaultRootDirPath = useAppBranchDefaultRootDirPath({
    appId: appInfo.id,
    appBranchId: appBranchInfo.id,
  });

  const [shouldCreateAppBranchDesktopShortcut, setShouldCreateAppBranchDesktopShortcut] = useState<boolean>(false);

  const [shouldCreateAppBranchStartMenuShortcut, setShouldCreateAppBranchStartMenuShortcut] = useState<boolean>(true);

  const [appBranchRootDirPath, setAppBranchRootDirPath] = useState<string>(appBranchDefaultRootDirPath);

  const appBranchRootDirDiskFreeSpaceBytesCountQuery = useDirDiskFreeSpaceBytesCountQuery({
    dirPath: appBranchRootDirPath,
  });

  const appBranchRootDirDiskFreeSpaceAfterInstallBytesCount = (
    appBranchRootDirDiskFreeSpaceBytesCountQuery.data === undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    || appBranchRootDirDiskFreeSpaceBytesCountQuery.data.errorTypeName !== undefined
  )
    ? undefined
    : appBranchRootDirDiskFreeSpaceBytesCountQuery.data.dirDiskFreeSpaceBytesCount - appBranchLatestVersionInfo.dataBytesCount;

  return (
    <div className="flex size-full flex-col justify-between">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="overflow-hidden" asChild>
                <TypographyInlineCode className="h-8 content-center truncate text-center">
                  {appBranchRootDirPath}
                </TypographyInlineCode>
              </TooltipTrigger>
              <TooltipContent>
                {appBranchRootDirPath}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="overflow-hidden" asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    const { selectAppBranchRootDirDialogResult } = await displaySelectAppBranchRootDirDialog({
                      selectAppBranchRootDirDialogConfig: {
                        title: `Select installation directory`,
                        message: `Select installation directory`,
                        appId: appInfo.id,
                        appBranchId: appBranchInfo.id,
                      },
                    });

                    if (selectAppBranchRootDirDialogResult.selectedDirPath === undefined) {
                      return;
                    }

                    setAppBranchRootDirPath(selectAppBranchRootDirDialogResult.selectedDirPath);
                  }}
                >
                  <FolderEditIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Select installation directory
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
          <TypographyMuted>Required disk space:</TypographyMuted>
          <TypographyMuted>{getBytesCountLabel(appBranchLatestVersionInfo.dataBytesCount)}</TypographyMuted>
          <TypographyMuted>Available disk space:</TypographyMuted>
          {
            appBranchRootDirDiskFreeSpaceBytesCountQuery.data === undefined
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            || appBranchRootDirDiskFreeSpaceBytesCountQuery.data.errorTypeName !== undefined
              ? <Spinner variant="sm" />
              : (
                  <TypographyMuted>
                    {getBytesCountLabel(appBranchRootDirDiskFreeSpaceBytesCountQuery.data.dirDiskFreeSpaceBytesCount)}
                  </TypographyMuted>
                )
          }
        </div>
        {
          appBranchRootDirDiskFreeSpaceAfterInstallBytesCount !== undefined
            ? appBranchRootDirDiskFreeSpaceAfterInstallBytesCount < 0
              ? (
                  <TypographySmall className="text-yellow-600 dark:text-yellow-500">
                    {
                      [
                        `Missing`,
                        getBytesCountLabel(
                          -appBranchRootDirDiskFreeSpaceAfterInstallBytesCount,
                        ),
                        `of free disk space.`,
                      ].join(` `)
                    }
                  </TypographySmall>
                )
              : (
                  <TypographySmall className="text-green-600 dark:text-green-500">
                    Enough free disk space.
                  </TypographySmall>
                )
            : <></>
        }
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Checkbox
            checked={shouldCreateAppBranchDesktopShortcut}
            onCheckedChange={(checked) => {
              setShouldCreateAppBranchDesktopShortcut(checked === true);
            }}
          />
          <TypographyMuted>Create Desktop Shortcut</TypographyMuted>
        </div>
        {
          IS_CREATING_START_MENU_SHORTCUT_SUPPORTED
            ? (
                <div className="flex flex-row gap-2">
                  <Checkbox
                    checked={shouldCreateAppBranchStartMenuShortcut}
                    onCheckedChange={(checked) => {
                      setShouldCreateAppBranchStartMenuShortcut(checked === true);
                    }}
                  />
                  <TypographyMuted>Create Start Menu Shortcut</TypographyMuted>
                </div>
              )
            : <></>
        }
        <div className="flex flex-row justify-end gap-2">
          <DialogClose asChild>
            <Button
              className="w-48"
              disabled={
                appBranchController.isAnyMutationPending
                || appBranchRootDirDiskFreeSpaceAfterInstallBytesCount === undefined
                || appBranchRootDirDiskFreeSpaceAfterInstallBytesCount < 0
              }
              onClick={async () => {
                await appBranchController.registerAndStartUpdateTaskMutation.mutate({
                  appBranchRootDirPath,
                  isAppBranchNotEmptyRootDirAllowed: true,
                });

                if (shouldCreateAppBranchDesktopShortcut) {
                  await tryCreatingAppBranchDesktopShortcut({
                    appInfo,
                    appBranchInfo,
                  });
                }

                if (shouldCreateAppBranchStartMenuShortcut) {
                  await tryCreatingAppBranchStartMenuShortcut({
                    appInfo,
                    appBranchInfo,
                  });
                }
              }}
            >
              Install
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              className="w-24"
              variant="destructive"
            >
              Cancel
            </Button>
          </DialogClose>
        </div>
      </div>
    </div>
  );
}

export function InstallAppBranchDialogContent(
  {
    appInfo,
    appBranchInfo,
    appBranchController,
  }: {
    appInfo: AppInfo;
    appBranchInfo: AppBranchInfo;
    appBranchController: AppNotRegisteredBranchController;
  },
) {
  const appLabel = getAppLabel({
    appInfo,
    appBranchInfo: appBranchInfo,
  });

  return (
    <DialogContent className="max-w-[800px]">
      <DialogHeader>
        <DialogTitle>
          {appLabel}
        </DialogTitle>
      </DialogHeader>
      <div className="h-64">
        <Suspense fallback={<SpinnerLayout />}>
          <InstallAppBranchDialogSuspenseContent
            appInfo={appInfo}
            appBranchInfo={appBranchInfo}
            appBranchController={appBranchController}
          />
        </Suspense>
      </div>
    </DialogContent>
  );
}
