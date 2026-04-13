import { useNavigate } from "@tanstack/react-router";
import {
  APP_MAIN_BRANCH_ID,
  AppInfo,
  useAppBranchInfoSuspenseQuery,
  useAppBranchLatestVersionIdQuery,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  useAppBranchSuspenseController,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";
import {
  DownloadIcon,
  OctagonXIcon,
  PlayIcon,
  Settings2Icon,
  StarIcon,
} from "lucide-react";

import { AppSettingsDialogContent } from "@/components/app-settings-dialog-content";
import { InstallAppBranchDialogContent } from "@/components/install-app-branch-dialog-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { TypographyH3 } from "@/components/ui/typography-h3";
import { useAppDefaultBranchIdInfo } from "@/lib/stores/apps-default-branch-id-store";
import {
  useAppIsFavouriteInfo,
  useSetAppIsFavouriteInfo,
} from "@/lib/stores/apps-favourite-info-store";
import { getAppBranchLabel } from "@/lib/get-app-branch-label";
import { cn } from "@/lib/utils";

export function AppCard(
  {
    appId,
    appInfo,
  }: {
    appId: string;
    appInfo: AppInfo;
  },
) {
  const appDefaultBranchId = useAppDefaultBranchIdInfo({
    appId,
  }).defaultBranchId;

  const navigate = useNavigate();

  const isAppFavourite = useAppIsFavouriteInfo({
    appId,
  }).isFavourite;

  const setAppFavouriteInfo = useSetAppIsFavouriteInfo();

  const { data: appDefaultBranchInfoData } = useAppBranchInfoSuspenseQuery({
    appId,
    appBranchId: appDefaultBranchId,
  });
  if (!appDefaultBranchInfoData.isValid) {
    return null;
  }
  const appDefaultBranchInfo = appDefaultBranchInfoData.appBranchInfo;

  const appDefaultBranchController = useAppBranchSuspenseController({
    appId,
    appBranchId: appDefaultBranchId,
  });

  const appLatestVersionIdQuery = useAppBranchLatestVersionIdQuery({
    appId,
    appBranchId: appDefaultBranchId,
  });

  return (
    <div
      className="flex flex-col gap-2"
    >
      <div className="group relative h-96 w-full overflow-hidden rounded-lg">
        <img
          src={appInfo.bannerUrl}
          className="size-full cursor-pointer object-cover transition group-hover:scale-110 group-hover:brightness-50 dark:group-hover:brightness-150"
          onClick={async () => {
            await navigate({
              to: "/user-is-authenticated/library/app/$app-id",
              params: { "app-id": appId },
              search: prev => ({
                ...prev,
                isAppDownloadsPanelOpen: false,
              }),
            });
          }}
        />
        <div
          className="pointer-events-none absolute left-0 top-0 flex size-full flex-col justify-between p-2 opacity-0 transition group-hover:opacity-100"
        >
          <div className="flex flex-row items-center justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="pointer-events-auto"
                  variant="outline"
                  size="icon"
                >
                  <Settings2Icon className="size-5" />
                </Button>
              </DialogTrigger>
              <AppSettingsDialogContent
                appId={appId}
              />
            </Dialog>
          </div>
          <div className="flex flex-row items-center justify-between">
            <Button
              className={cn(
                "pointer-events-auto",
                isAppFavourite
                  ? "pointer-events-auto text-yellow-600 hover:text-yellow-600 dark:text-yellow-500 dark:hover:text-yellow-500"
                  : undefined,
              )}
              variant="outline"
              size="icon"
              onClick={() => {
                setAppFavouriteInfo({
                  appId,
                  appIsFavouriteInfo: {
                    isFavourite: !isAppFavourite,
                  },
                });
              }}
            >
              <StarIcon className="size-5" />
            </Button>
            {
              !appDefaultBranchController.isRegistered
                ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="pointer-events-auto"
                          variant="outline"
                          size="icon"
                          disabled={
                            appDefaultBranchController.registerAndStartUpdateTaskMutation.status === `pending`
                          }
                        >
                          <DownloadIcon className="size-5" />
                        </Button>
                      </DialogTrigger>
                      <InstallAppBranchDialogContent
                        appInfo={appInfo}
                        appBranchInfo={appDefaultBranchInfo}
                        appBranchController={appDefaultBranchController}
                      />
                    </Dialog>
                  )
                : appDefaultBranchController.ongoingTask !== undefined
                  || appDefaultBranchController.installedVersionId === undefined
                  ? (
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={true}
                      >
                        <Spinner />
                      </Button>
                    )
                  : appDefaultBranchController.process !== undefined
                    ? (
                        <Button
                          className="pointer-events-auto"
                          variant="destructive"
                          size="icon"
                          {
                            ...(
                              appDefaultBranchController.process.killMutation.status === `pending`
                                ? {
                                    disabled: true,
                                  }
                                : {
                                    onClick: async () => {
                                      await appDefaultBranchController.process?.killMutation.mutate({});
                                    },
                                  }
                            )
                          }
                        >
                          <OctagonXIcon className="size-5" />
                        </Button>
                      )
                    : (
                        <Button
                          className="pointer-events-auto text-green-600 hover:text-green-600 dark:text-green-500 dark:hover:text-green-500"
                          variant="outline"
                          size="icon"
                          {
                            ...(
                              appDefaultBranchController.startProcessMutation.status === `pending`
                                ? {
                                    disabled: true,
                                  }
                                : {
                                    onClick: async () => {
                                      await appDefaultBranchController.startProcessMutation.mutate({});
                                    },
                                  }
                            )
                          }
                        >
                          <PlayIcon className="size-5" />
                        </Button>
                      )
            }
          </div>
        </div>
      </div>
      <div className="flex h-8 flex-row items-center justify-between">
        <TypographyH3>{appInfo.name}</TypographyH3>
        <div className="flex flex-row gap-1">
          {
            appLatestVersionIdQuery.data !== undefined
            && appLatestVersionIdQuery.data.errorTypeName === undefined
            && appDefaultBranchController.isRegistered
            && appDefaultBranchController.lastInstalledVersionId !== appLatestVersionIdQuery.data.appBranchLatestVersionId
              ? (
                  <Badge variant="outline">Update Available</Badge>
                )
              : <></>
          }
          {
            appDefaultBranchId !== APP_MAIN_BRANCH_ID.value
              ? (
                  <Badge variant="outline">{getAppBranchLabel({ appBranchInfo: appDefaultBranchInfo })}</Badge>
                )
              : <></>
          }
        </div>
      </div>
    </div>
  );
}
