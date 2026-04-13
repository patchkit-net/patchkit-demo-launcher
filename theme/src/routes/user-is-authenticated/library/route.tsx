import {
  createFileRoute,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import {
  AppBranchDataTaskState,
  AppBranchStatus,
  AppBranchTaskType,
  AppInfo,
  useAppBranchTaskStateSuspenseQuery,
  useAppsRegisteredBranchesStateSuspenseQuery,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  useAppBranchRepairTaskCancelMutation,
  useAppBranchStartRepairTaskMutation,
  useAppBranchStartUpdateTaskMutation,
  useAppBranchUpdateTaskCancelMutation,
  useAppInfoSuspenseQuery,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  PanelsRightBottomIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import {
  Suspense,
  useEffect,
  useRef,
} from "react";

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
import { useAddDownloadHistoryEntry, useClearDownloadsHistory, useCompleteDownloadHistoryEntry, useDownloadsHistory, useRemoveOngoingDownloadHistoryEntry } from "@/lib/stores/downloads-history-store";
import { useIsDownloadsPanelOpen, useSetIsDownloadsPanelOpen } from "@/lib/stores/downloads-panel-store";

export const Route = createFileRoute("/user-is-authenticated/library")({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
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
          <div className="flex flex-col gap-2">
            <TypographySmall>{appInfo.name ?? appId}</TypographySmall>
            <AppBranchDataTaskProgressView appBranchDataTaskState={appBranchDataTaskState} />
          </div>
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
  const { data: appInfoData } = useAppInfoSuspenseQuery({
    appId,
  });
  if (!appInfoData.isValid) {
    throw new Error(`Failed to fetch app info: ${appInfoData.errorTypeName}`);
  }
  const appInfo = appInfoData.appInfo;

  const { data: appBranchTaskStateData } = useAppBranchTaskStateSuspenseQuery({
    appId,
    appBranchId,
    appBranchTaskId,
  });
  if (!appBranchTaskStateData.isValid) {
    throw new Error(`Failed to fetch task state: ${appBranchTaskStateData.errorTypeName}`);
  }
  const appBranchTaskState = appBranchTaskStateData.appBranchTaskState;

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

function AppBranchFinishedDataTaskCard(
  {
    appId,
    progressPercentage,
    statusLabel,
    completedDate,
  }: {
    appId: string;
    progressPercentage: number;
    statusLabel: string;
    completedDate?: string;
  },
) {
  const { data: appInfoData } = useAppInfoSuspenseQuery({ appId });
  if (!appInfoData.isValid) return null;
  const appInfo = appInfoData.appInfo;

  return (
    <Card>
      <CardContent className="grid grid-cols-[auto_1fr] items-center gap-6 p-6">
        <AppBranchDataTaskLeftView appInfo={appInfo} />
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center justify-between">
            <TypographySmall>{appInfo.name ?? appId}</TypographySmall>
            {completedDate !== undefined && <TypographyMuted>{completedDate}</TypographyMuted>}
          </div>
          <div className="relative h-5 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${String(progressPercentage * 100)}%` }}
            />
            <div className="absolute left-0 top-0 flex size-full items-center justify-center">
              <TypographySmall>{statusLabel}</TypographySmall>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppsDownloads() {
  const { data: appsRegisteredBranchesStateData } = useAppsRegisteredBranchesStateSuspenseQuery({});
  if (!appsRegisteredBranchesStateData.isValid) {
    throw new Error(`Failed to fetch registered branches state: ${appsRegisteredBranchesStateData.errorTypeName}`);
  }
  const appsRegisteredBranchesState = appsRegisteredBranchesStateData.appsRegisteredBranchesState;

  const allBranches = Object.entries(appsRegisteredBranchesState).flatMap(
    ([appId, appRegisteredBranchesState]) => Object.entries(appRegisteredBranchesState).map(
      ([appBranchId, appBranchState]) => ({ appId, appBranchId, appBranchState }),
    ),
  );

  const isDataTask = (type: AppBranchTaskType) =>
    type === AppBranchTaskType.UpdateTask || type === AppBranchTaskType.RepairTask;

  const downloadingBranches = allBranches.filter(b =>
    b.appBranchState.status === AppBranchStatus.Processing
    && isDataTask(b.appBranchState.ongoingTask.type),
  );

  const pausedBranches = allBranches.filter(b =>
    b.appBranchState.status !== AppBranchStatus.Processing
    && b.appBranchState.lastFinishedDataTaskInfo !== undefined
    && isDataTask(b.appBranchState.lastFinishedDataTaskInfo.type)
    && b.appBranchState.lastFinishedDataTaskInfo.errorTypeName !== undefined,
  );

  const activeBranches = [...downloadingBranches, ...pausedBranches];

  const clearDownloadsHistory = useClearDownloadsHistory();
  const downloadsHistory = useDownloadsHistory();
  const pastEntries = downloadsHistory.filter(e => e.completedDate > 0);

  return (
    <ScrollArea className="size-full">
      <div className="flex flex-col gap-6 p-8">
        {activeBranches.length > 0 && (
          <>
            <TypographyMuted>Active Downloads</TypographyMuted>
            {downloadingBranches.map(({ appId, appBranchId, appBranchState }) => {
              if (appBranchState.status !== AppBranchStatus.Processing) return null;
              return (
                <Suspense key={`downloading-${appId}-${appBranchId}`} fallback={<></>}>
                  <AppBranchTaskView
                    appId={appId}
                    appBranchId={appBranchState.id}
                    appBranchTaskId={appBranchState.ongoingTask.id}
                  />
                </Suspense>
              );
            })}
            {pausedBranches.map(({ appId, appBranchId, appBranchState }) => {
              const taskId = appBranchState.lastOngoingTaskId;
              if (taskId === undefined) return null;
              return (
                <Suspense key={`paused-${appId}-${appBranchId}`} fallback={<></>}>
                  <AppBranchTaskView
                    appId={appId}
                    appBranchId={appBranchState.id}
                    appBranchTaskId={taskId}
                  />
                </Suspense>
              );
            })}
          </>
        )}
        {pastEntries.length > 0 && (
          <>
            {activeBranches.length > 0 && <Separator />}
            <div className="flex flex-row items-center justify-between">
              <TypographyMuted>Past Downloads</TypographyMuted>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { clearDownloadsHistory(); }}
              >
                <TypographyMuted>Clear</TypographyMuted>
              </Button>
            </div>
            {pastEntries.map((entry, index) => (
              <Suspense key={`finished-${entry.appId}-${entry.appBranchId}-${index}`} fallback={<></>}>
                <AppBranchFinishedDataTaskCard
                  appId={entry.appId}
                  progressPercentage={1}
                  statusLabel={entry.taskType === "install" ? "Installed" : entry.taskType === "repair" ? "Repaired" : "Updated"}
                  completedDate={new Date(entry.completedDate).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                />
              </Suspense>
            ))}
          </>
        )}
        {activeBranches.length === 0 && pastEntries.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <TypographyMuted>No downloads</TypographyMuted>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function RouteComponent() {
  const isAppDownloadsPanelOpen = useIsDownloadsPanelOpen();
  const setIsDownloadsPanelOpen = useSetIsDownloadsPanelOpen();

  const { data: appsRegisteredBranchesStateData } = useAppsRegisteredBranchesStateSuspenseQuery({});

  const ongoingDataTaskBranches = appsRegisteredBranchesStateData.isValid
    ? Object.entries(appsRegisteredBranchesStateData.appsRegisteredBranchesState).flatMap(
      ([appId, branches]) => Object.entries(branches)
        .filter(([, branch]) => branch.status === AppBranchStatus.Processing
          && (branch.ongoingTask.type === AppBranchTaskType.UpdateTask || branch.ongoingTask.type === AppBranchTaskType.RepairTask))
        .map(([appBranchId, branch]) => ({ appId, appBranchId, branch })),
    )
    : [];

  const ongoingDownloadsCount = ongoingDataTaskBranches.length;

  const addDownloadHistoryEntry = useAddDownloadHistoryEntry();
  const completeDownloadHistoryEntry = useCompleteDownloadHistoryEntry();
  const removeOngoingDownloadHistoryEntry = useRemoveOngoingDownloadHistoryEntry();
  const previousOngoingKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentOngoingKeys = new Set(
      ongoingDataTaskBranches.map(b => `${b.appId}:${b.appBranchId}`),
    );

    for (const b of ongoingDataTaskBranches) {
      if (!previousOngoingKeysRef.current.has(`${b.appId}:${b.appBranchId}`) && b.branch.status === AppBranchStatus.Processing) {
        const taskType = b.branch.ongoingTask.type === AppBranchTaskType.RepairTask
          ? "repair" as const
          : b.branch.lastInstalledVersionId === undefined
            ? "install" as const
            : "update" as const;
        addDownloadHistoryEntry({
          appId: b.appId,
          appBranchId: b.appBranchId,
          taskType,
          completedDate: 0,
        });
      }
    }

    if (appsRegisteredBranchesStateData.isValid) {
      for (const key of previousOngoingKeysRef.current) {
        if (!currentOngoingKeys.has(key)) {
          const [appId = "", appBranchId = ""] = key.split(":");
          const branchState = appsRegisteredBranchesStateData.appsRegisteredBranchesState[appId]?.[appBranchId];
          if (branchState === undefined) continue;
          if (branchState.status === AppBranchStatus.Processing) continue;

          const isPaused = branchState.lastFinishedDataTaskInfo !== undefined
            && branchState.lastFinishedDataTaskInfo.errorTypeName !== undefined;

          if (isPaused) {
            // Task was paused (cancelled) — keep ongoing entry, will show in Active as paused
            continue;
          }

          const didCompleteSuccessfully = branchState.lastFinishedDataTaskInfo !== undefined
            && branchState.lastFinishedDataTaskInfo.errorTypeName === undefined;

          if (didCompleteSuccessfully) {
            completeDownloadHistoryEntry(appId, appBranchId);
          } else {
            removeOngoingDownloadHistoryEntry(appId, appBranchId);
          }
        }
      }
    }

    previousOngoingKeysRef.current = currentOngoingKeys;
  }, [ongoingDataTaskBranches, addDownloadHistoryEntry, completeDownloadHistoryEntry, removeOngoingDownloadHistoryEntry, appsRegisteredBranchesStateData]);

  return (
    <div
      className="grid size-full animate-fade grid-rows-[1fr_auto_auto] animate-duration-500 animate-ease-in"
    >
      <div className="overflow-hidden">
        <Outlet />
      </div>
      <Separator />
      <Sheet
        open={isAppDownloadsPanelOpen}
        onOpenChange={setIsDownloadsPanelOpen}
      >
        <SheetTrigger asChild>
          <div className="flex h-12 cursor-pointer items-center justify-center">
            <TypographyMuted>
              {ongoingDownloadsCount > 0 ? `Downloads (${ongoingDownloadsCount})` : "Downloads"}
            </TypographyMuted>
          </div>
        </SheetTrigger>
          <SheetContent className="grid h-[calc(100vh-96px)] grid-rows-[auto_1fr]" side="bottom" aria-describedby="">
            <SheetHeader>
              <SheetTitle>Downloads</SheetTitle>
            </SheetHeader>
            <div className="overflow-hidden">
              <AppsDownloads />
            </div>
          </SheetContent>
      </Sheet>
    </div>
  );
}
