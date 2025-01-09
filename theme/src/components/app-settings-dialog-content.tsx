import {
  APP_MAIN_BRANCH_ID,
  AppBranchInfo,
  AppBranchState,
  AppInfo,
  displaySelectAppBranchRootDirDialog,
  focusFileSystemEntryInFileExplorer,
  useAppBranchInfo,
  useAppInfo,
  useAppRegisteredBranchesState,
  useAppSecondaryBranchesInfoSuspenseValidQuery,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  AppBranchController,
  useAppBranchLastDataTaskFinishedDate,
  useAppBranchLastProcessStartedDate,
  useAppBranchSuspenseController,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  FolderSearchIcon,
  HardDriveDownloadIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AppDefaultBranchIdInfo,
  SetAppDefaultBranchIdInfo,
  useAppDefaultBranchIdInfo,
  useSetAppDefaultBranchIdInfo,
} from "@/lib/apps-default-branch-id-store";
import { getAppBranchLabel } from "@/lib/get-app-branch-label";
import { getAppLabel } from "@/lib/get-app-label";
import { tryCreatingAppBranchDesktopShortcut } from "@/lib/try-creating-app-branch-desktop-shortcut";
import { tryCreatingAppBranchStartMenuShortcut } from "@/lib/try-creating-app-branch-start-menu-shortcut";
import { cn } from "@/lib/utils";

import { AreYouSureDialogContent } from "./are-you-sure-dialog-content";
import { InstallAppBranchDialogContent } from "./install-app-branch-dialog-content";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { TypographyInlineCode } from "./ui/typography-inline-code";
import { TypographyMuted } from "./ui/typography-muted";

function AppSettingsDialogContentInstallationTabContent(
  {
    appInfo,
    appDefaultBranchInfo,
    appDefaultBranchController,
  }: {
    appInfo: AppInfo;
    appDefaultBranchInfo: AppBranchInfo;
    appDefaultBranchController: AppBranchController;
  },
) {
  const appLabel = getAppLabel({ appInfo, appBranchInfo: appDefaultBranchInfo });

  const appBranchLastDataTaskFinishedDate = useAppBranchLastDataTaskFinishedDate({
    appId: appInfo.id,
    appBranchId: appDefaultBranchInfo.id,
  });

  const appBranchLastProcessStartedDate = useAppBranchLastProcessStartedDate({
    appId: appInfo.id,
    appBranchId: appDefaultBranchInfo.id,
  });

  return (
    <Card className="grid size-full grid-rows-[auto_1fr_auto]">
      <CardHeader>
        <CardTitle>Installation</CardTitle>
        <CardDescription>
          {`Manage ${appLabel} installation.`}
        </CardDescription>
      </CardHeader>
      {
        appDefaultBranchController.isRegistered
          ? (
              <>
                <CardContent className="flex flex-col items-center gap-2">
                  <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="overflow-hidden" asChild>
                          <TypographyInlineCode className="h-8 content-center truncate text-center">
                            {appDefaultBranchController.rootDir.path}
                          </TypographyInlineCode>
                        </TooltipTrigger>
                        <TooltipContent>
                          {appDefaultBranchController.rootDir.path}
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
                              await focusFileSystemEntryInFileExplorer({
                                fileSystemEntryPath: appDefaultBranchController.rootDir.path,
                              });
                            }}
                          >
                            <FolderSearchIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Open installation directory
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex w-full flex-row gap-2">
                    <Button
                      className="w-full"
                      onClick={async () => {
                        await tryCreatingAppBranchDesktopShortcut({
                          appInfo: appInfo,
                          appBranchInfo: appDefaultBranchInfo,
                        });
                      }}
                    >
                      Create Desktop Shortcut
                    </Button>
                    <Button
                      className="w-full"
                      onClick={async () => {
                        await tryCreatingAppBranchStartMenuShortcut({
                          appInfo: appInfo,
                          appBranchInfo: appDefaultBranchInfo,
                        });
                      }}
                    >
                      Create Start Menu Shortcut
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    disabled={
                      appDefaultBranchController.ongoingTask !== undefined
                      || (
                        appDefaultBranchController.installedVersionId !== undefined
                        && appDefaultBranchController.process !== undefined
                      )
                      || appDefaultBranchController.isAnyMutationPending
                    }
                    onClick={async () => {
                      const { selectAppBranchRootDirDialogResult } = await displaySelectAppBranchRootDirDialog({
                        selectAppBranchRootDirDialogConfig: {
                          title: `Select installation directory`,
                          message: `Select installation directory`,
                          appId: appInfo.id,
                          appBranchId: appDefaultBranchInfo.id,
                        },
                      });

                      if (selectAppBranchRootDirDialogResult.selectedDirPath === undefined) {
                        return;
                      }

                      await appDefaultBranchController.startMoveTaskMutation.mutate({
                        appBranchNewRootDirPath: selectAppBranchRootDirDialogResult.selectedDirPath,
                      });
                    }}
                  >
                    Change installation directory
                  </Button>
                  <TypographyMuted>After clicking this button, directory picker will open.</TypographyMuted>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full bg-orange-700 text-white hover:bg-orange-800"
                        disabled={
                          appDefaultBranchController.ongoingTask !== undefined
                          || (
                            appDefaultBranchController.installedVersionId !== undefined
                            && appDefaultBranchController.process !== undefined
                          )
                          || appDefaultBranchController.isAnyMutationPending
                        }
                      >
                        Repair
                      </Button>
                    </DialogTrigger>
                    <AreYouSureDialogContent
                      title="Are you sure about repairing?"
                      message={`This operation will check data integrity for ${appLabel} but can take a long time to finish.`}
                      onConfirm={async () => {
                        await appDefaultBranchController.startRepairTaskMutation.mutate({});
                      }}
                    />
                  </Dialog>
                  <TypographyMuted>Use this option if you suspsect that files are corrupted.</TypographyMuted>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        variant="destructive"
                        disabled={
                          appDefaultBranchController.ongoingTask !== undefined
                          || (
                            appDefaultBranchController.installedVersionId !== undefined
                            && appDefaultBranchController.process !== undefined
                          )
                          || appDefaultBranchController.isAnyMutationPending
                        }
                      >
                        Uninstall
                      </Button>
                    </DialogTrigger>
                    <AreYouSureDialogContent
                      title="Are you sure about uninstalling?"
                      message={`This will remove all files associated with ${appLabel}.`}
                      onConfirm={async () => {
                        await appDefaultBranchController.startUninstallTaskMutation.mutate({});
                      }}
                    />
                  </Dialog>
                  <div className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-x-2">
                    <TypographyMuted>
                      Last Updated:
                    </TypographyMuted>
                    <TypographyMuted>
                      {
                        appBranchLastDataTaskFinishedDate !== undefined
                          ? appBranchLastDataTaskFinishedDate.toLocaleString()
                          : "-"
                      }
                    </TypographyMuted>
                    <TypographyMuted>
                      Last Played:
                    </TypographyMuted>
                    <TypographyMuted>
                      {
                        appBranchLastProcessStartedDate !== undefined
                          ? appBranchLastProcessStartedDate.toLocaleString()
                          : "-"
                      }
                    </TypographyMuted>
                  </div>
                </CardFooter>
              </>
            )
          : (
              <>
                <CardContent className="flex size-full items-center justify-center">
                  <TypographyMuted>{`${appLabel} is not installed.`}</TypographyMuted>
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full bg-blue-700 text-white hover:bg-blue-800"
                        variant="default"
                        disabled={
                          appDefaultBranchController.isAnyMutationPending
                        }
                      >
                        Install
                      </Button>
                    </DialogTrigger>
                    <InstallAppBranchDialogContent
                      appInfo={appInfo}
                      appBranchInfo={appDefaultBranchInfo}
                      appBranchController={appDefaultBranchController}
                    />
                  </Dialog>

                </CardFooter>
              </>
            )
      }

    </Card>
  );
}

function SelectAppDefaultBranchComponent(
  {
    appId,
    appMainBranchInfo,
    appSecondaryBranchesInfo,
    appRegisteredBranchesState,
    appDefaultBranchIdInfo,
    setAppDefaultBranchIdInfo,
    appDefaultBranchInfo,
  }: {
    appId: string;
    appMainBranchInfo: AppBranchInfo;
    appSecondaryBranchesInfo: {
      [appBranchId: string]: AppBranchInfo;
    };
    appRegisteredBranchesState: {
      [appBranchId: string]: AppBranchState;
    };
    appDefaultBranchIdInfo: AppDefaultBranchIdInfo;
    setAppDefaultBranchIdInfo: SetAppDefaultBranchIdInfo;
    appDefaultBranchInfo: AppBranchInfo;
  },
) {
  const [open, setOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const buttonWidth = buttonRef.current?.offsetWidth;

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {getAppBranchLabel({ appBranchInfo: appDefaultBranchInfo })}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="p-0" style={{ width: buttonWidth }}>
        <Command>
          <CommandInput placeholder="Search branch..." />
          <CommandList>
            <CommandEmpty>No branch found.</CommandEmpty>
            <CommandGroup>
              {Object.entries(appSecondaryBranchesInfo).concat([[APP_MAIN_BRANCH_ID.value, appMainBranchInfo]]).map(([appBranchId, appBranchInfo]) => (
                <CommandItem
                  key={appBranchId}
                  value={appBranchId}
                  onSelect={() => {
                    setAppDefaultBranchIdInfo({
                      appId,
                      appDefaultBranchIdInfo: {
                        defaultBranchId: appBranchId,
                      },
                    });
                    setOpen(false);
                  }}
                >
                  <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2">
                    <CheckIcon
                      className={cn(
                        {
                          "opacity-0": appBranchId !== appDefaultBranchIdInfo.defaultBranchId,
                        },
                      )}
                    />
                    <>{getAppBranchLabel({ appBranchInfo })}</>
                    {
                      appRegisteredBranchesState[appBranchId] !== undefined
                        ? (
                            <HardDriveDownloadIcon />
                          )
                        : <></>
                    }
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AppSettingsDialogContentBranchesTabContent(
  {
    appInfo,
    appMainBranchInfo,
    appSecondaryBranchesInfo,
    appRegisteredBranchesState,
    appDefaultBranchIdInfo,
    setAppDefaultBranchIdInfo,
    appDefaultBranchInfo,
  }: {
    appInfo: AppInfo;
    appMainBranchInfo: AppBranchInfo;
    appSecondaryBranchesInfo: {
      [appBranchId: string]: AppBranchInfo;
    };
    appRegisteredBranchesState: {
      [appBranchId: string]: AppBranchState;
    };
    appDefaultBranchIdInfo: AppDefaultBranchIdInfo;
    setAppDefaultBranchIdInfo: SetAppDefaultBranchIdInfo;
    appDefaultBranchInfo: AppBranchInfo;
  },
) {
  return (
    <Card className="grid size-full grid-rows-[auto_1fr]">
      <CardHeader>
        <CardTitle>Branches</CardTitle>
        <CardDescription>
          {`Switch between different branches of ${appInfo.name}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <SelectAppDefaultBranchComponent
          appId={appInfo.id}
          appMainBranchInfo={appMainBranchInfo}
          appSecondaryBranchesInfo={appSecondaryBranchesInfo}
          appRegisteredBranchesState={appRegisteredBranchesState}
          appDefaultBranchIdInfo={appDefaultBranchIdInfo}
          setAppDefaultBranchIdInfo={setAppDefaultBranchIdInfo}
          appDefaultBranchInfo={appDefaultBranchInfo}
        />
        <TypographyMuted>
          Remember that you can have multiple branches installed at the same time.
        </TypographyMuted>
      </CardContent>
    </Card>
  );
}

export function AppSettingsDialogContent(
  {
    appId,
  }: {
    appId: string;
  },
) {
  const appInfo = useAppInfo({
    appId,
  });

  const appRegisteredBranchesState = useAppRegisteredBranchesState({
    appId,
  });

  const appMainBranchInfo = useAppBranchInfo({
    appId,
    appBranchId: APP_MAIN_BRANCH_ID.value,
  });

  const appSecondaryBranchesInfoQuery = useAppSecondaryBranchesInfoSuspenseValidQuery({
    appId,
    pageLimit: 10,
  });

  useEffect(
    () => {
      if (appSecondaryBranchesInfoQuery.isNextPageAvailable && !appSecondaryBranchesInfoQuery.isNextPageBeingLoaded) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        appSecondaryBranchesInfoQuery.fetchNextPage();
      }
    },
    [
      appSecondaryBranchesInfoQuery,
    ],
  );

  const appSecondaryBranchesInfo = Object.fromEntries(
    appSecondaryBranchesInfoQuery.pages.flatMap(
      x => Object.entries(x.data.appSecondaryBranchesInfo),
    ),
  );

  const appDefaultBranchIdInfo = useAppDefaultBranchIdInfo({
    appId,
  });

  const setAppDefaultBranchIdInfo = useSetAppDefaultBranchIdInfo();

  const appDefaultBranchInfo = useAppBranchInfo({
    appId,
    appBranchId: appDefaultBranchIdInfo.defaultBranchId,
  });

  const appDefaultBranchController = useAppBranchSuspenseController({
    appId,
    appBranchId: appDefaultBranchIdInfo.defaultBranchId,
  });

  const appLabel = getAppLabel({
    appInfo,
    appBranchInfo: appDefaultBranchInfo,
  });

  return (
    <DialogContent className="max-w-[800px]">
      <DialogHeader>
        <DialogTitle>
          {appLabel}
        </DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="installation" className="grid h-[500px] grid-rows-[auto_1fr]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>
        <TabsContent value="installation">
          <AppSettingsDialogContentInstallationTabContent
            appInfo={appInfo}
            appDefaultBranchInfo={appDefaultBranchInfo}
            appDefaultBranchController={appDefaultBranchController}
          />
        </TabsContent>
        <TabsContent value="branches">
          <AppSettingsDialogContentBranchesTabContent
            appInfo={appInfo}
            appMainBranchInfo={appMainBranchInfo}
            appSecondaryBranchesInfo={appSecondaryBranchesInfo}
            appRegisteredBranchesState={appRegisteredBranchesState}
            appDefaultBranchIdInfo={appDefaultBranchIdInfo}
            setAppDefaultBranchIdInfo={setAppDefaultBranchIdInfo}
            appDefaultBranchInfo={appDefaultBranchInfo}
          />
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}
