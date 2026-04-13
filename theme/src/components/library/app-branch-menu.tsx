import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  AppBranchInfo,
  AppBranchRepairTaskCancelMutation,
  AppBranchStartRepairTaskMutation,
  AppBranchStartUpdateTaskMutation,
  AppBranchTaskType,
  AppBranchUpdateTaskCancelMutation,
  AppInfo,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  ChartLineIcon,
  OctagonXIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";

import { InstallAppBranchDialogContent } from "@/components/install-app-branch-dialog-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { TypographySmall } from "@/components/ui/typography-small";
import { AppBranchController, AppNotRegisteredBranchController, AppRegisteredBranchController } from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";

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
  const location = useLocation();

  return (
    <div className="grid w-96 grid-cols-[auto_1fr_auto] items-center gap-6 rounded-lg border bg-card px-4 py-2">
      <Button
        variant="outline"
        size="icon"
        disabled={appBranchOngoingDataTaskCancelMutation.status === `pending`}
        onClick={async () => {
          await navigate({
            to: location.pathname,
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

export function AppBranchMenu(
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
