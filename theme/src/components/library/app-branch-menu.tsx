import { useSetIsDownloadsPanelOpen } from "@/lib/stores/downloads-panel-store";
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
          className="w-48"
          variant="outline"
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
  const setIsDownloadsPanelOpen = useSetIsDownloadsPanelOpen();

  return (
    <div className="grid w-96 grid-cols-[auto_1fr_auto] items-center gap-6 rounded-lg border bg-card px-4 py-2">
      <Button
        variant="outline"
        size="icon"
        disabled={appBranchOngoingDataTaskCancelMutation.status === `pending`}
        onClick={() => { setIsDownloadsPanelOpen(true); }}
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
    isUpdateAvailable,
  }: {
    appBranchController: AppRegisteredBranchController;
    isUpdateAvailable?: boolean;
  },
) {
  if (appBranchController.ongoingTask !== undefined) {
    const ongoingTask = appBranchController.ongoingTask;
    const isDataTask = ongoingTask.type === AppBranchTaskType.UpdateTask || ongoingTask.type === AppBranchTaskType.RepairTask;

    if (isDataTask) {
      const progressPercentage = ongoingTask.progress === undefined || ongoingTask.progress.writeTask.totalBytesCount === 0
        ? 0
        : ongoingTask.progress.writeTask.processedBytesCount / ongoingTask.progress.writeTask.totalBytesCount;

      return (
        <AppRegisteredBranchOngoingDataTaskMenu
          appBranchOngoingDataTaskProgressPercentage={progressPercentage}
          appBranchOngoingDataTaskCancelMutation={ongoingTask.cancelMutation}
        />
      );
    }

    return (
      <Spinner />
    );
  }

  if (appBranchController.installedVersionId === undefined) {
    if (appBranchController.lastFailedDataTask !== undefined) {
      const failedTask = appBranchController.lastFailedDataTask;
      const failedProgressPercentage = failedTask.progress === undefined || failedTask.progress.writeTask.totalBytesCount === 0
        ? 0
        : failedTask.progress.writeTask.processedBytesCount / failedTask.progress.writeTask.totalBytesCount;

      const resumeMutation = failedTask.type === AppBranchTaskType.RepairTask
        ? appBranchController.startRepairTaskMutation
        : appBranchController.doesNeedRepairing
          ? appBranchController.startRepairTaskMutation
          : appBranchController.startUpdateTaskMutation;

      return (
        <AppRegisteredBranchFailedDataTaskMenu
          appBranchFailedDataTaskProgressPercentage={failedProgressPercentage}
          appBranchStartDataTaskMutation={resumeMutation}
        />
      );
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

  if (isUpdateAvailable) {
    return (
      <Button
        variant="outline"
        className="w-48"
        disabled={appBranchController.isAnyMutationPending}
        onClick={async () => {
          await appBranchController.startUpdateTaskMutation.mutate({});
        }}
      >
        Update
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
    isUpdateAvailable,
  }: {
    appId: string;
    appInfo: AppInfo;
    appBranchId: string;
    appBranchInfo: AppBranchInfo;
    appBranchController: AppBranchController;
    isUpdateAvailable?: boolean;
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

  return <AppRegisteredBranchMenu appBranchController={appBranchController} isUpdateAvailable={isUpdateAvailable} />;
}
