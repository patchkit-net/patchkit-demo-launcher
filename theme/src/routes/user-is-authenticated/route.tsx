import {
  DialogClose,
  DialogContent,
} from "@radix-ui/react-dialog";
import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
  useMatches,
  useNavigate,
} from "@tanstack/react-router";
import {
  AppBranchRepairTaskHasBeenCancelled,
  AppBranchRootDirDoesNotHaveEnoughDiskFreeSpaceForRepairTask,
  AppBranchRootDirDoesNotHaveEnoughDiskFreeSpaceForUpdateTask,
  AppBranchRootDirPermissionsAreInsufficient,
  AppBranchTaskType,
  AppBranchUpdateTaskHasBeenCancelled,
  ID,
  startAppBranchProcess,
  startAppBranchRepairTask,
  startAppBranchUpdateTask,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  forwardRef,
  useCallback,
  useContext,
  useState,
} from "react";

import { SpinnerLayout } from "@/components/spinner-layout";
import {
  Button,
  ButtonProps,
} from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TypographyLarge } from "@/components/ui/typography-large";
import { TypographyMuted } from "@/components/ui/typography-muted";
import { UserContext } from "@/contexts/user-context";
import { cn } from "@/lib/utils";
import { useAppBranchTaskFinishedPendingEventListener, useProtocolPendingRequestListener } from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";

export const Route = createFileRoute("/user-is-authenticated")({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
  beforeLoad: (
    {
      context,
    },
  ) => {
    if (context.userAuth === undefined) {
      throw redirect({ to: "/user-is-not-authenticated" });
    }

    return {};
  },
});

const NavbarButton = forwardRef<HTMLButtonElement, ButtonProps & { isActive: boolean }>(
  (
    {
      isActive,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        className={cn(
          "text-muted-foreground hover:text-primary hover:no-underline",
          className,
          isActive ? "text-primary" : null,
        )}
        variant="link"
        ref={ref}
        {...props}
      >
        <TypographyLarge>{children}</TypographyLarge>
      </Button>
    );
  },
);
NavbarButton.displayName = "NavbarButton";

function RouteComponent() {
  const matches = useMatches();

  const navigate = useNavigate();

  const { userAuth } = useContext(UserContext);

  const [appDataTaskErrorDialogState, setAppDataTaskErrorDialogState] = useState<{
    title: string;
    message: string;
    retry: () => void;
  } | undefined>(undefined);

  useAppBranchTaskFinishedPendingEventListener(
    useCallback(
      (
        {
          appBranchTaskFinishedPendingEventController,
        },
      ) => {
        const {
          appId,
          appBranchId,
          appBranchTask: appBranchTaskInfo,
        } = appBranchTaskFinishedPendingEventController.info;

        if (
          appBranchTaskInfo.type === AppBranchTaskType.RepairTask
          && appBranchTaskInfo.errorTypeName !== undefined
          && appBranchTaskInfo.errorTypeName !== AppBranchRepairTaskHasBeenCancelled.name
        ) {
          let appDataTaskErrorDialogMessage: string;

          switch (appBranchTaskInfo.errorTypeName) {
            case AppBranchRootDirDoesNotHaveEnoughDiskFreeSpaceForRepairTask.name: {
              appDataTaskErrorDialogMessage = "The installation directory does not have enough free space to repair.";
              break;
            }
            case AppBranchRootDirPermissionsAreInsufficient.name: {
              appDataTaskErrorDialogMessage = "The installation directory does not have sufficient permissions to repair.";
              break;
            }
            default: {
              appDataTaskErrorDialogMessage = "An error occurred while repairing.";
              break;
            }
          }

          setAppDataTaskErrorDialogState({
            title: "Error",
            message: appDataTaskErrorDialogMessage,
            retry: async () => {
              await startAppBranchRepairTask({
                appId,
                appBranchId,
              });
            },
          });
        } else if (
          appBranchTaskInfo.type === AppBranchTaskType.UpdateTask
          && appBranchTaskInfo.errorTypeName !== undefined
          && appBranchTaskInfo.errorTypeName !== AppBranchUpdateTaskHasBeenCancelled.name
        ) {
          let appDataTaskErrorDialogMessage: string;

          switch (appBranchTaskInfo.errorTypeName) {
            case AppBranchRootDirDoesNotHaveEnoughDiskFreeSpaceForUpdateTask.name: {
              appDataTaskErrorDialogMessage = "The installation directory does not have enough free space to updating.";
              break;
            }
            case AppBranchRootDirPermissionsAreInsufficient.name: {
              appDataTaskErrorDialogMessage = "The installation directory does not have sufficient permissions to updating.";
              break;
            }
            default: {
              appDataTaskErrorDialogMessage = "An error occurred while updating.";
              break;
            }
          }

          setAppDataTaskErrorDialogState({
            title: "Error",
            message: appDataTaskErrorDialogMessage,
            retry: async () => {
              await startAppBranchUpdateTask({
                appId,
                appBranchId,
              });
            },
          });
        }
      },
      [],
    ),
  );

  useProtocolPendingRequestListener(
    useCallback(
      async (
        {
          protocolPendingRequestController,
        },
      ) => {
        const urlAsObject = new URL(protocolPendingRequestController.info.url);
        console.log(urlAsObject);

        if (urlAsObject.href.startsWith(`${ID.value}://start-app-branch-process`)) {
          const appId = urlAsObject.searchParams.get("appId");
          const appBranchId = urlAsObject.searchParams.get("appBranchId");

          if (appId !== null && appBranchId !== null) {
            await startAppBranchProcess({
              appId,
              appBranchId,
            });

            await navigate({
              from: Route.fullPath,
              to: `/user-is-authenticated/library/app/${appId}`,
              search: prev => ({
                ...prev,
              }),
            });
          }
        }
      },
      [navigate],
    ),
  );

  if (userAuth === undefined) {
    return <Navigate to="/user-is-not-authenticated" />;
  }

  return (
    <div className="grid size-full animate-fade grid-rows-[auto_auto_1fr] animate-duration-500 animate-ease-in">
      <div className="flex flex-row items-center p-2">
        <NavbarButton
          isActive={matches.find(x => x.routeId === "/user-is-authenticated/") !== undefined}
          onClick={async () => {
            await navigate({
              from: Route.fullPath,
              to: "/user-is-authenticated",
              search: prev => ({
                ...prev,
              }),
            });
          }}
        >
          Home
        </NavbarButton>
        <NavbarButton
          isActive={matches.find(x => x.routeId === "/user-is-authenticated/library") !== undefined}
          onClick={async () => {
            await navigate({
              from: Route.fullPath,
              to: "/user-is-authenticated/library",
              search: prev => ({
                ...prev,
                isAppDownloadsPanelOpen: false,
              }),
            });
          }}
        >
          Library
        </NavbarButton>
      </div>
      <Separator />
      <div className="overflow-hidden">
        <Outlet />
      </div>
      {
        appDataTaskErrorDialogState !== undefined
        && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {appDataTaskErrorDialogState.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-6">
              <TypographyMuted>{appDataTaskErrorDialogState.message}</TypographyMuted>
              <div className="flex flex-row justify-end gap-2">
                <DialogClose asChild>
                  <Button
                    className="w-24"
                    onClick={appDataTaskErrorDialogState.retry}
                  >
                    Retry
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
          </DialogContent>
        )
      }
    </div>
  );
}
