import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import {
  AppBranchInfo,
  AppBranchTaskType,
  AppInfo,
  AppScreenshotInfo,
  AppVideoInfo,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  AppBranchRepairTaskCancelMutation,
  AppBranchStartRepairTaskMutation,
  AppBranchStartUpdateTaskMutation,
  AppBranchUpdateTaskCancelMutation,
  useAppBranchInfo,
  useAppInfo,
  useAppScreenshotsInfoSuspenseValidQuery,
  useAppVideosInfoSuspenseValidQuery,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  ChartLineIcon,
  OctagonXIcon,
  PauseIcon,
  PlayIcon,
  Settings2,
  StarIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
} from "react";

import { AppSettingsDialogContent } from "@/components/app-settings-dialog-content";
import { InstallAppBranchDialogContent } from "@/components/install-app-branch-dialog-content";
import { SpinnerLayout } from "@/components/spinner-layout";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { TypographyBlockquote } from "@/components/ui/typography-blockquote";
import { TypographyH1 } from "@/components/ui/typography-h1";
import { TypographyH3 } from "@/components/ui/typography-h3";
import { TypographyMuted } from "@/components/ui/typography-muted";
import { TypographySmall } from "@/components/ui/typography-small";
import { useAppDefaultBranchIdInfo } from "@/lib/apps-default-branch-id-store";
import {
  useAppIsFavouriteInfo,
  useSetAppIsFavouriteInfo,
} from "@/lib/apps-favourite-info-store";
import { getAppLabel } from "@/lib/get-app-label";
import { cn } from "@/lib/utils";
import { AppBranchController, AppNotRegisteredBranchController, AppRegisteredBranchController, useAppBranchSuspenseController } from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";

export const Route = createFileRoute(
  "/user-is-authenticated/library/app/$app-id/",
)({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
});

function AppNotRegisteredBranchMenu(
  {
    appInfo,
    appBranchInfo,
    appBranchController,
  }: {
    appId: string;
    appInfo: AppInfo;
    appBranchId: string;
    appBranchInfo: AppBranchInfo;
    appBranchController: AppNotRegisteredBranchController;
  },
) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="w-48 bg-blue-500 text-white hover:bg-blue-400 hover:text-white dark:bg-blue-600 dark:hover:bg-blue-700"
          disabled={appBranchController.isAnyMutationPending}
        >
          Install
        </Button>
      </DialogTrigger>
      <InstallAppBranchDialogContent
        appInfo={appInfo}
        appBranchInfo={appBranchInfo}
        appBranchController={appBranchController}
      />
    </Dialog>
  );
}

function AppRegisteredBranchOngoingDataTaskMenu(
  {
    appBranchOngoingDataTaskProgressPercentage,
    appBranchOngoingDataTaskCancelMutation,
  }: {
    appBranchOngoingDataTaskProgressPercentage: number;
    appBranchOngoingDataTaskCancelMutation: AppBranchUpdateTaskCancelMutation | AppBranchRepairTaskCancelMutation;
  },
) {
  const navigate = useNavigate();

  return (
    <div className="grid w-96 grid-cols-[auto_1fr_auto] items-center gap-6 rounded-lg border bg-card px-4 py-2">
      <Button
        variant="outline"
        size="icon"
        disabled={appBranchOngoingDataTaskCancelMutation.status === `pending`}
        onClick={async () => {
          await navigate({
            from: Route.fullPath,
            to: Route.fullPath,
            search: prev => ({
              ...prev,
              isAppDownloadsPanelOpen: true,
            }),
          });
        }}
      >
        <ChartLineIcon className="size-5" />
      </Button>
      <div className="relative h-5 w-full rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-green-500"
          style={{
            width: `${String(appBranchOngoingDataTaskProgressPercentage * 100)}%`,
          }}
        />
        <div className="absolute left-0 top-0 flex size-full items-center justify-center">
          <TypographySmall>
            {
              `${String(Math.round(appBranchOngoingDataTaskProgressPercentage * 100))}%`
            }
          </TypographySmall>
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        disabled={appBranchOngoingDataTaskCancelMutation.status === `pending`}
        onClick={async () => {
          await appBranchOngoingDataTaskCancelMutation.mutate({});
        }}
      >
        <PauseIcon className="size-5" />
      </Button>
    </div>
  );
}

function AppRegisteredBranchFailedDataTaskMenu(
  {
    appBranchFailedDataTaskProgressPercentage,
    appBranchStartDataTaskMutation,
  }: {
    appBranchFailedDataTaskProgressPercentage: number;
    appBranchStartDataTaskMutation: AppBranchStartUpdateTaskMutation | AppBranchStartRepairTaskMutation;
  },
) {
  return (
    <div className="grid w-96 grid-cols-[1fr_auto] items-center gap-2 rounded-lg border bg-card px-4 py-2">
      <div className="relative h-5 w-full rounded-full bg-secondary">
        <div className="absolute left-0 top-0 flex size-full items-center justify-center">
          <TypographySmall>
            {
              `${String(Math.round(appBranchFailedDataTaskProgressPercentage * 100))}%`
            }
          </TypographySmall>
        </div>
        <div
          className="h-full rounded-full bg-green-500"
          style={{
            width: `${String(appBranchFailedDataTaskProgressPercentage * 100)}%`,
          }}
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        disabled={appBranchStartDataTaskMutation.status === `pending`}
        onClick={async () => {
          await appBranchStartDataTaskMutation.mutate({});
        }}
      >
        <PlayIcon className="size-5" />
      </Button>
    </div>
  );
}

function AppRegisteredBranchMenu(
  {
    appBranchController,
  }: {
    appBranchController: AppRegisteredBranchController;
  },
) {
  if (appBranchController.ongoingTask !== undefined) {
    if (
      appBranchController.ongoingTask.type === AppBranchTaskType.UpdateTask
      || appBranchController.ongoingTask.type === AppBranchTaskType.RepairTask
    ) {
      return (
        <AppRegisteredBranchOngoingDataTaskMenu
          appBranchOngoingDataTaskProgressPercentage={
            appBranchController.ongoingTask.progress === undefined || appBranchController.ongoingTask.progress.writeTask.totalBytesCount === 0
              ? 0
              : (
                  appBranchController.ongoingTask.progress.writeTask.processedBytesCount
                  / appBranchController.ongoingTask.progress.writeTask.totalBytesCount
                )
          }
          appBranchOngoingDataTaskCancelMutation={appBranchController.ongoingTask.cancelMutation}
        />
      );
    }

    return (
      <Spinner />
    );
  }

  if (appBranchController.installedVersionId === undefined) {
    if (appBranchController.lastFailedDataTask !== undefined) {
      switch (appBranchController.lastFailedDataTask.type) {
        case AppBranchTaskType.UpdateTask: {
          return (
            <AppRegisteredBranchFailedDataTaskMenu
              appBranchFailedDataTaskProgressPercentage={
                appBranchController.lastFailedDataTask.progress === undefined || appBranchController.lastFailedDataTask.progress.writeTask.totalBytesCount === 0
                  ? 0
                  : (
                      appBranchController.lastFailedDataTask.progress.writeTask.processedBytesCount
                      / appBranchController.lastFailedDataTask.progress.writeTask.totalBytesCount
                    )
              }
              appBranchStartDataTaskMutation={
                appBranchController.doesNeedRepairing
                  ? appBranchController.startRepairTaskMutation
                  : appBranchController.startUpdateTaskMutation
              }
            />
          );
        }
        case AppBranchTaskType.RepairTask: {
          return (
            <AppRegisteredBranchFailedDataTaskMenu
              appBranchFailedDataTaskProgressPercentage={
                appBranchController.lastFailedDataTask.progress === undefined || appBranchController.lastFailedDataTask.progress.writeTask.totalBytesCount === 0
                  ? 0
                  : (
                      appBranchController.lastFailedDataTask.progress.writeTask.processedBytesCount
                      / appBranchController.lastFailedDataTask.progress.writeTask.totalBytesCount
                    )
              }
              appBranchStartDataTaskMutation={appBranchController.startRepairTaskMutation}
            />
          );
        }
      }
    }

    if (appBranchController.doesNeedRepairing) {
      return (
        <Button
          variant="outline"
          disabled={appBranchController.startRepairTaskMutation.status === `pending`}
          onClick={async () => {
            await appBranchController.startRepairTaskMutation.mutate({});
          }}
        >
          Repair
        </Button>
      );
    }

    return (
      <AppRegisteredBranchFailedDataTaskMenu
        appBranchFailedDataTaskProgressPercentage={0}
        appBranchStartDataTaskMutation={appBranchController.startUpdateTaskMutation}
      />
    );
  }

  if (appBranchController.process !== undefined) {
    const appBranchProcessController = appBranchController.process;

    return (
      <Button
        className="text-red-600 hover:text-red-600 dark:text-red-500 dark:hover:text-red-500"
        variant="outline"
        size="icon"
        disabled={appBranchController.isAnyMutationPending}
        onClick={async () => {
          await appBranchProcessController.killMutation.mutate({});
        }}
      >
        <OctagonXIcon className="size-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-48 bg-green-500 text-white hover:bg-green-400 hover:text-white dark:bg-green-600 dark:hover:bg-green-700"
      disabled={appBranchController.isAnyMutationPending}
      onClick={async () => {
        await appBranchController.startProcessMutation.mutate({});
      }}
    >
      Start
    </Button>
  );
}

function AppBranchMenu(
  {
    appId,
    appInfo,
    appBranchId,
    appBranchInfo,
    appBranchController,
  }: {
    appId: string;
    appInfo: AppInfo;
    appBranchId: string;
    appBranchInfo: AppBranchInfo;
    appBranchController: AppBranchController;
  },
) {
  if (
    !appBranchController.isRegistered
  ) {
    return (
      <AppNotRegisteredBranchMenu
        appId={appId}
        appInfo={appInfo}
        appBranchId={appBranchId}
        appBranchInfo={appBranchInfo}
        appBranchController={appBranchController}
      />
    );
  }

  return <AppRegisteredBranchMenu appBranchController={appBranchController} />;
}

function RouteComponent() {
  const {
    "app-id": appId,
  } = Route.useParams();

  const isAppFavourite = useAppIsFavouriteInfo({
    appId,
  }).isFavourite;

  const setIsAppFavouriteInfo = useSetAppIsFavouriteInfo();

  const appInfo = useAppInfo({
    appId,
  });

  const appScreenshotsInfoQuery = useAppScreenshotsInfoSuspenseValidQuery({
    appId,
    pageLimit: 10,
  });

  const appVideosInfoQuery = useAppVideosInfoSuspenseValidQuery({
    appId,
    pageLimit: 10,
  });

  useEffect(
    () => {
      if (appScreenshotsInfoQuery.isNextPageAvailable && !appScreenshotsInfoQuery.isNextPageBeingLoaded) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        appScreenshotsInfoQuery.fetchNextPage();
      }
    },
    [
      appScreenshotsInfoQuery,
    ],
  );

  useEffect(
    () => {
      if (appVideosInfoQuery.isNextPageAvailable && !appVideosInfoQuery.isNextPageBeingLoaded) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        appVideosInfoQuery.fetchNextPage();
      }
    },
    [
      appVideosInfoQuery,
    ],
  );

  const appMediasInfo = useMemo(
    () => {
      return Object.fromEntries(
        [
          ...appScreenshotsInfoQuery.pages.flatMap(x => Object.entries(x.data.appScreenshotsInfo))
            .map(
              ([appScreenshotId, appScreenshotInfo]) => {
                return [appScreenshotId, { type: "screenshot", ...appScreenshotInfo }];
              },
            ) as [string, ({ type: "screenshot" } & AppScreenshotInfo) | ({ type: "video" } & AppVideoInfo)][],
          ...appVideosInfoQuery.pages.flatMap(x => Object.entries(x.data.appVideosInfo))
            .map(
              ([appVideoId, appVideoInfo]) => {
                return [appVideoId, { type: "video", ...appVideoInfo }];
              },
            ) as [string, ({ type: "screenshot" } & AppScreenshotInfo) | ({ type: "video" } & AppVideoInfo)][],
        ]
          .sort(([, a], [, b]) => a.order - b.order),
      );
    },
    [
      appScreenshotsInfoQuery,
      appVideosInfoQuery,
    ],
  );

  const appDefaultBranchId = useAppDefaultBranchIdInfo({
    appId,
  }).defaultBranchId;

  const appDefaultBranchInfo = useAppBranchInfo({
    appId,
    appBranchId: appDefaultBranchId,
  });

  const appDefaultBranchController = useAppBranchSuspenseController({
    appId,
    appBranchId: appDefaultBranchId,
  });

  return (
    <div className="grid size-full animate-fade grid-rows-[auto_auto_1fr] animate-duration-500 animate-ease-in">
      <div
        className="flex flex-row items-center justify-between px-12 py-6"
      >
        <div className="flex flex-row items-center gap-6">
          <TypographyH1>{getAppLabel({ appInfo, appBranchInfo: appDefaultBranchInfo })}</TypographyH1>
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
              setIsAppFavouriteInfo({
                appId,
                appIsFavouriteInfo: {
                  isFavourite: !isAppFavourite,
                },
              });
            }}
          >
            <StarIcon className="size-5" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
              >
                <Settings2 className="size-5" />
              </Button>
            </DialogTrigger>
            <AppSettingsDialogContent
              appId={appId}
            />
          </Dialog>
        </div>
        <div className="flex h-12 flex-row items-center gap-6">
          <AppBranchMenu
            appId={appId}
            appInfo={appInfo}
            appBranchId={appDefaultBranchId}
            appBranchInfo={appDefaultBranchInfo}
            appBranchController={appDefaultBranchController}
          />
        </div>
      </div>
      <Separator />
      <div className="flex size-full items-center justify-center">
        <ScrollArea className="max-h-full w-full">
          <div className="grid grid-cols-2 gap-6 px-12 py-8">
            <div className="flex items-center justify-center px-12">
              <Carousel>
                <CarouselContent>
                  {Object.entries(appMediasInfo).map(([appMediaId, appMediaInfo]) => (
                    <CarouselItem key={appMediaId}>
                      <div
                        className="flex h-full flex-col justify-between gap-2"
                      >
                        <TypographyH3 className="text-center">
                          {appMediaInfo.name}
                        </TypographyH3>
                        {
                          appMediaInfo.type === "screenshot"
                            ? (
                                <Dialog>
                                  <DialogTrigger>
                                    <img src={appMediaInfo.url} className="h-auto w-full rounded-lg border-2" />
                                  </DialogTrigger>
                                  <DialogContent className="h-[calc(100vh-200px)] w-[calc(100vw-200px)] max-w-none" aria-describedby="">
                                    <DialogTitle></DialogTitle>
                                    <img src={appMediaInfo.url} className="absolute left-0 top-0 size-full rounded-lg object-cover" />
                                  </DialogContent>
                                </Dialog>
                              )
                            : <video src={appMediaInfo.url} className="h-auto w-full rounded-lg border-2" controls />
                        }
                        <TypographyMuted className="text-center">
                          {appMediaInfo.description}
                        </TypographyMuted>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
            <TypographyBlockquote>
              <div className="flex size-full flex-col items-center justify-center text-center">
                {appInfo.longDescription}
              </div>
            </TypographyBlockquote>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
