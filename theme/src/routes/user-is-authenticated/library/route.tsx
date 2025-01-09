import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  AppBranchDataTaskState,
  AppBranchState,
  AppBranchTaskType,
  AppInfo,
  useAppBranchTaskState,
  useAppsRegisteredBranchesState,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  useAppBranchRepairTaskCancelMutation,
  useAppBranchStartRepairTaskMutation,
  useAppBranchStartUpdateTaskMutation,
  useAppBranchUpdateTaskCancelMutation,
  useAppInfo,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  PanelsRightBottomIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import { Suspense } from "react";

import { AppBranchDataTaskProgressBpsChart } from "@/components/app-branch-data-task-progress-bps-chart";
import { SpinnerLayout } from "@/components/spinner-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TypographyMuted } from "@/components/ui/typography-muted";
import { TypographySmall } from "@/components/ui/typography-small";

export const Route = createFileRoute("/user-is-authenticated/library")({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
  validateSearch: (search): {
    isAppDownloadsPanelOpen: boolean;
  } => {
    return {
      isAppDownloadsPanelOpen: search.isAppDownloadsPanelOpen as boolean,
    };
  },
});

function AppBranchDataTaskLeftView(
  {
    appInfo,
  }: {
    appInfo: AppInfo;
  },
) {
  return (
    <div className="w-12">
      <img
        className="w-full object-cover"
        src={appInfo.iconUrl}
      />
    </div>
  );
}

function AppBranchDataTaskProgressView(
  {
    appBranchDataTaskState,
  }: {
    appBranchDataTaskState: AppBranchDataTaskState;
  },
) {
  const appBranchDataTaskProgressPercentage = appBranchDataTaskState.progress === undefined || appBranchDataTaskState.progress.writeTask.totalBytesCount === 0
    ? 0
    : (appBranchDataTaskState.progress.writeTask.processedBytesCount / appBranchDataTaskState.progress.writeTask.totalBytesCount);

  return (
    <div className="relative h-5 w-full rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-green-500"
        style={{
          width: `${String(appBranchDataTaskProgressPercentage * 100)}%`,
        }}
      />
      <div className="absolute left-0 top-0 flex size-full items-center justify-center">
        <TypographySmall>
          {
            appBranchDataTaskState.isFinished
              ? appBranchDataTaskState.errorTypeName === undefined
                ? `Completed`
                : `Paused`
              : `${String(Math.round(appBranchDataTaskProgressPercentage * 100))}%`
          }
        </TypographySmall>
      </div>
    </div>
  );
}

function AppBranchDataTaskRightView(
  {
    appId,
    appBranchId,
    appBranchDataTaskId,
    appBranchDataTaskState,
  }: {
    appId: string;
    appBranchId: string;
    appBranchDataTaskId: number;
    appBranchDataTaskState: AppBranchDataTaskState;
  },
) {
  const navigate = useNavigate();

  const appBranchStartUpdateTaskMutation = useAppBranchStartUpdateTaskMutation({
    appId,
    appBranchId,
  });

  const appBranchStartRepairTaskMutation = useAppBranchStartRepairTaskMutation({
    appId,
    appBranchId,
  });

  const appBranchUpdateTaskCancelMutation = useAppBranchUpdateTaskCancelMutation({
    appId,
    appBranchId,
    appBranchUpdateTaskId: appBranchDataTaskId,
  });

  const appBranchRepairTaskCancelMutation = useAppBranchRepairTaskCancelMutation({
    appId,
    appBranchId,
    appBranchRepairTaskId: appBranchDataTaskId,
  });

  let appBranchStartDataTaskMutation;
  let appBranchDataTaskCancelMutation;

  switch (appBranchDataTaskState.type) {
    case AppBranchTaskType.UpdateTask:
      appBranchStartDataTaskMutation = appBranchStartUpdateTaskMutation;
      appBranchDataTaskCancelMutation = appBranchUpdateTaskCancelMutation;
      break;
    case AppBranchTaskType.RepairTask:
      appBranchStartDataTaskMutation = appBranchStartRepairTaskMutation;
      appBranchDataTaskCancelMutation = appBranchRepairTaskCancelMutation;
      break;
  }

  return (
    <div className="w-12">
      {
        appBranchDataTaskState.isFinished
          ? appBranchDataTaskState.errorTypeName === undefined
            ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await navigate({
                      to: "/user-is-authenticated/library/app/$app-id",
                      params: {
                        "app-id": appId,
                      },
                      search: prev => ({
                        ...prev,
                        isAppDownloadsPanelOpen: false,
                      }),
                    });
                  }}
                >
                  <PanelsRightBottomIcon className="size-5" />
                </Button>
              )
            : (
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
              )
          : (
              <Button
                variant="outline"
                size="icon"
                disabled={appBranchDataTaskCancelMutation.status === `pending`}
                onClick={async () => {
                  await appBranchDataTaskCancelMutation.mutate({});
                }}
              >
                <PauseIcon className="size-5" />
              </Button>
            )
      }
    </div>
  );
}

function AppBranchDataTaskView(
  {
    appId,
    appInfo,
    appBranchId,
    appBranchDataTaskId,
    appBranchDataTaskState,
  }: {
    appId: string;
    appInfo: AppInfo;
    appBranchId: string;
    appBranchDataTaskId: number;
    appBranchDataTaskState: AppBranchDataTaskState;
  },
) {
  return (
    <Card className="h-96">
      <CardContent className="grid size-full grid-rows-[auto_1fr] p-6">
        <div className="grid size-full grid-cols-[auto_1fr_auto] items-center gap-6 p-6">
          <AppBranchDataTaskLeftView appInfo={appInfo} />
          <AppBranchDataTaskProgressView appBranchDataTaskState={appBranchDataTaskState} />
          <AppBranchDataTaskRightView
            appId={appId}
            appBranchId={appBranchId}
            appBranchDataTaskId={appBranchDataTaskId}
            appBranchDataTaskState={appBranchDataTaskState}
          />
        </div>
        <AppBranchDataTaskProgressBpsChart
          className="aspect-auto h-48 w-full"
          appId={appId}
          appBranchId={appBranchId}
          appBranchDataTaskId={appBranchDataTaskId}
        />
      </CardContent>
    </Card>
  );
}

function AppBranchTaskView(
  {
    appId,
    appBranchId,
    appBranchTaskId,
  }: {
    appId: string;
    appBranchId: string;
    appBranchTaskId: number;
  },
) {
  const appInfo = useAppInfo({
    appId,
  });

  const appBranchTaskState = useAppBranchTaskState({
    appId,
    appBranchId,
    appBranchTaskId,
  });

  if (
    appBranchTaskState.type === AppBranchTaskType.UpdateTask
    || appBranchTaskState.type === AppBranchTaskType.RepairTask
  ) {
    return (
      <AppBranchDataTaskView
        appId={appId}
        appInfo={appInfo}
        appBranchId={appBranchId}
        appBranchDataTaskId={appBranchTaskId}
        appBranchDataTaskState={appBranchTaskState}
      />
    );
  }

  return <></>;
}

function AppBranchLastOngoingDataTaskView(
  {
    appId,
    appBranchState,
  }: {
    appId: string;
    appBranchState: AppBranchState;
  },
) {
  const appBranchLastOngoingDataTaskId = appBranchState.lastOngoingDataTaskId;

  if (appBranchLastOngoingDataTaskId === undefined) {
    return <></>;
  }

  return (
    <AppBranchTaskView
      appId={appId}
      appBranchId={appBranchState.id}
      appBranchTaskId={appBranchLastOngoingDataTaskId}
    />
  );
}

function AppsDownloads() {
  const appsRegisteredBranchesState = useAppsRegisteredBranchesState({});

  return (
    <ScrollArea className="size-full">
      <div className="flex flex-col gap-6 p-8">
        {
          Object.entries(appsRegisteredBranchesState).flatMap(
            ([appId, appRegisteredBranchesState]) => Object.entries(appRegisteredBranchesState).map(
              ([appBranchId, appBranchState]) => {
                return (
                  <Suspense key={`${appId}-${appBranchId}`} fallback={<></>}>
                    <AppBranchLastOngoingDataTaskView
                      appId={appId}
                      appBranchState={appBranchState}
                    />
                  </Suspense>
                );
              },
            ),
          )
        }
      </div>
    </ScrollArea>
  );
}

function RouteComponent() {
  const navigate = useNavigate();

  const location = useLocation();

  const isAppDownloadsPanelOpen = location.search.isAppDownloadsPanelOpen ?? false;

  return (
    <div
      className="grid size-full animate-fade grid-rows-[1fr_auto_auto] animate-duration-500 animate-ease-in"
    >
      <div className="overflow-hidden">
        <Outlet />
      </div>
      <Separator />
      <div className="flex h-12 items-center justify-center">
        <Sheet
          open={isAppDownloadsPanelOpen}
          onOpenChange={(open) => {
            navigate({
              from: Route.fullPath,
              to: location.pathname,
              search: prev => ({
                ...prev,
                isAppDownloadsPanelOpen: open,
              }),
            });
          }}
        >
          <SheetTrigger>
            <TypographyMuted>Downloads</TypographyMuted>
          </SheetTrigger>
          <SheetContent className="h-[calc(100vh-96px)]" side="bottom" aria-describedby="">
            <SheetHeader>
              <SheetTitle>Downloads</SheetTitle>
            </SheetHeader>
            <AppsDownloads />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
