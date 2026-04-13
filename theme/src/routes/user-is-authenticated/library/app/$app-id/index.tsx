import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AppScreenshotInfo,
  AppVideoInfo,
  useAppBranchInfoSuspenseQuery,
  useAppInfoSuspenseQuery,
  useAppScreenshotsInfoSuspenseQuery,
  useAppVideosInfoSuspenseQuery,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  ChevronLeftIcon,
  Settings2,
  StarIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
} from "react";

import { AppSettingsDialogContent } from "@/components/app-settings-dialog-content";
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
import { TypographyBlockquote } from "@/components/ui/typography-blockquote";
import { TypographyH1 } from "@/components/ui/typography-h1";
import { TypographyH3 } from "@/components/ui/typography-h3";
import { TypographyMuted } from "@/components/ui/typography-muted";
import { useAppDefaultBranchIdInfo } from "@/lib/stores/apps-default-branch-id-store";
import {
  useAppIsFavouriteInfo,
  useSetAppIsFavouriteInfo,
} from "@/lib/stores/apps-favourite-info-store";
import { getAppLabel } from "@/lib/get-app-label";
import { cn } from "@/lib/utils";
import { getYouTubeEmbedUrl, isYouTubeUrl } from "@/lib/video/youtube";
import { useAppBranchSuspenseController } from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";
import { AppBranchMenu } from "@/components/library/app-branch-menu";

export const Route = createFileRoute(
  "/user-is-authenticated/library/app/$app-id/",
)({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
});

function RouteComponent() {
  const {
    "app-id": appId,
  } = Route.useParams();

  const isAppFavourite = useAppIsFavouriteInfo({
    appId,
  }).isFavourite;

  const setIsAppFavouriteInfo = useSetAppIsFavouriteInfo();

  const { data: appInfoData } = useAppInfoSuspenseQuery({
    appId,
  });
  if (!appInfoData.isValid) {
    throw new Error(`Failed to fetch app info: ${appInfoData.errorTypeName}`);
  }
  const appInfo = appInfoData.appInfo;

  const appScreenshotsInfoQuery = useAppScreenshotsInfoSuspenseQuery({
    appId,
    pageLimit: 10,
  });

  const appVideosInfoQuery = useAppVideosInfoSuspenseQuery({
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
          ...appScreenshotsInfoQuery.pages.flatMap(x => x.data.isValid ? Object.entries(x.data.appScreenshotsInfo) : [])
            .map(
              ([appScreenshotId, appScreenshotInfo]) => {
                return [appScreenshotId, { type: "screenshot", ...appScreenshotInfo }];
              },
            ) as [string, ({ type: "screenshot" } & AppScreenshotInfo) | ({ type: "video" } & AppVideoInfo)][],
          ...appVideosInfoQuery.pages.flatMap(x => x.data.isValid ? Object.entries(x.data.appVideosInfo) : [])
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

  const { data: appDefaultBranchInfoData } = useAppBranchInfoSuspenseQuery({
    appId,
    appBranchId: appDefaultBranchId,
  });
  if (!appDefaultBranchInfoData.isValid) {
    throw new Error(`Failed to fetch branch info: ${appDefaultBranchInfoData.errorTypeName}`);
  }
  const appDefaultBranchInfo = appDefaultBranchInfoData.appBranchInfo;

  const navigate = useNavigate();

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
          <button
            className="text-foreground transition hover:-translate-x-1"
            onClick={async () => {
              await navigate({
                to: "/user-is-authenticated/library",
                search: prev => ({
                  ...prev,
                  isAppDownloadsPanelOpen: false,
                }),
              });
            }}
          >
            <ChevronLeftIcon strokeWidth={1.5} className="size-10" />
          </button>
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
                            : isYouTubeUrl(appMediaInfo.url)
                              ? <iframe src={getYouTubeEmbedUrl(appMediaInfo.url)} className="aspect-video w-full rounded-lg border-2" allow="autoplay; encrypted-media; fullscreen" />
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
