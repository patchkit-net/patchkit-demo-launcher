import {
  createFileRoute,
} from "@tanstack/react-router";
import {
  useAppsRegisteredBranchesStateSuspenseQuery,
  useAppsInfoSuspenseQuery,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  useAppsBranchesLastDataTaskFinishedDate,
  useAppsBranchesLastProcessStartedDate,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";
import Fuse from "fuse.js";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  SearchIcon,
} from "lucide-react";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import typia from "typia";

import { SpinnerLayout } from "@/components/spinner-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { TypographyH1 } from "@/components/ui/typography-h1";
import { TypographyH3 } from "@/components/ui/typography-h3";
import { TypographyMuted } from "@/components/ui/typography-muted";
import {
  APP_DEFAULT_BRANCH_ID_DEFAULT_INFO,
  useAppsDefaultBranchIdInfo,
} from "@/lib/stores/apps-default-branch-id-store";
import {
  useAppsIsFavouriteInfo,
} from "@/lib/stores/apps-favourite-info-store";
import { AppCard } from "@/components/library/app-card";

export const Route = createFileRoute("/user-is-authenticated/library/")({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
});

enum AppsFilteringUserMode {
  Disabled = "disabled",
  OnlyFavourite = "only-favourite",
  OnlyInstalled = "only-installed",
}

enum AppsFilteringMode {
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  Disabled = AppsFilteringUserMode.Disabled,
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  OnlyFavourite = AppsFilteringUserMode.OnlyFavourite,
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  OnlyInstalled = AppsFilteringUserMode.OnlyInstalled,
  SearchQuery = "search-query",
}

enum AppsSortingDirection {
  Asc = "asc",
  Desc = "desc",
}

enum AppsSortingMode {
  ByName = "by-name",
  ByPlayed = "by-played",
  ByUpdated = "by-updated",
}

export function RouteComponent() {
  const appsInfoQuery = useAppsInfoSuspenseQuery({
    pageLimit: 10,
  });

  useEffect(
    () => {
      if (appsInfoQuery.isNextPageAvailable && !appsInfoQuery.isNextPageBeingLoaded) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
        appsInfoQuery.fetchNextPage();
      }
    },
    [
      appsInfoQuery,
    ],
  );

  const { data: appsRegisteredBranchesStateData } = useAppsRegisteredBranchesStateSuspenseQuery({});
  if (!appsRegisteredBranchesStateData.isValid) {
    throw new Error(`Failed to fetch registered branches state: ${appsRegisteredBranchesStateData.errorTypeName}`);
  }
  const appsRegisteredBranchesState = appsRegisteredBranchesStateData.appsRegisteredBranchesState;

  const [appsFilteringUserMode, setAppsFilteringUserMode] = useState<AppsFilteringUserMode>(AppsFilteringUserMode.Disabled);

  const [appsSortingDirection, setAppsSortingDirection] = useState<AppsSortingDirection>(AppsSortingDirection.Asc);

  const [appsSortingMode, setAppsSortingMode] = useState<AppsSortingMode>(AppsSortingMode.ByName);

  const appsIsFavouriteInfo = useAppsIsFavouriteInfo();

  const appsDefaultBranchIdInfo = useAppsDefaultBranchIdInfo();

  const appsBranchesLastDataTaskFinishedDate = useAppsBranchesLastDataTaskFinishedDate({});

  const appsBranchesLastProcessStartedDate = useAppsBranchesLastProcessStartedDate({});

  const [appsSearchQuery, setAppsSearchQuery] = useState<string>("");

  const appsFilteringMode = useMemo<AppsFilteringMode>(
    () => {
      if (appsSearchQuery !== "") {
        return AppsFilteringMode.SearchQuery;
      }

      return appsFilteringUserMode as unknown as AppsFilteringMode;
    },
    [
      appsSearchQuery,
      appsFilteringUserMode,
    ],
  );

  const appsInfo = Object.fromEntries(
    appsInfoQuery.pages.flatMap(x => x.data.isValid ? Object.entries(x.data.appsInfo) : []),
  );

  const filteredAppsInfo = useMemo<typeof appsInfo>(
    () => {
      if (appsFilteringMode === AppsFilteringMode.SearchQuery) {
        const fuse = new Fuse(
          Object.entries(appsInfo),
          {
            keys: ["1.name"],
            threshold: 0.6,
          },
        );

        return Object.fromEntries(
          fuse.search(appsSearchQuery).map(x => x.item),
        );
      }

      return Object.fromEntries(
        Object.entries(appsInfo).filter(
          ([appId]) => {
            switch (appsFilteringMode) {
              case AppsFilteringMode.Disabled: {
                return true;
              }
              case AppsFilteringMode.OnlyFavourite: {
                return appsIsFavouriteInfo[appId]?.isFavourite === true;
              }
              case AppsFilteringMode.OnlyInstalled: {
                return Object.values(appsRegisteredBranchesState[appId] ?? {}).length > 0;
              }
            }
          },
        ),
      );
    },
    [
      appsInfo,
      appsFilteringMode,
      appsIsFavouriteInfo,
      appsRegisteredBranchesState,
      appsSearchQuery,
    ],
  );

  const sortedAppsInfo = useMemo<typeof appsInfo>(
    () => {
      if (appsFilteringMode === AppsFilteringMode.SearchQuery) {
        return filteredAppsInfo;
      }

      return Object.fromEntries(
        Object.entries(filteredAppsInfo).sort(
          ([, appInfoA], [, appInfoB]) => {
            let result = 0;

            const appADefaultBranchIdInfo = appsDefaultBranchIdInfo[appInfoA.id] ?? APP_DEFAULT_BRANCH_ID_DEFAULT_INFO;
            const appBDefaultBranchIdInfo = appsDefaultBranchIdInfo[appInfoB.id] ?? APP_DEFAULT_BRANCH_ID_DEFAULT_INFO;

            switch (appsSortingMode) {
              case AppsSortingMode.ByPlayed: {
                const appABranchLastProcessStartedDate = appsBranchesLastProcessStartedDate[appInfoA.id]?.[appADefaultBranchIdInfo.defaultBranchId];
                const appBBranchLastProcessStartedDate = appsBranchesLastProcessStartedDate[appInfoB.id]?.[appBDefaultBranchIdInfo.defaultBranchId];

                result = (appBBranchLastProcessStartedDate?.getTime() ?? 0) - (appABranchLastProcessStartedDate?.getTime() ?? 0);
                break;
              }
              case AppsSortingMode.ByUpdated: {
                const appABranchLastDataTaskFinishedDate = appsBranchesLastDataTaskFinishedDate[appInfoA.id]?.[appADefaultBranchIdInfo.defaultBranchId];
                const appBBranchLastDataTaskFinishedDate = appsBranchesLastDataTaskFinishedDate[appInfoB.id]?.[appBDefaultBranchIdInfo.defaultBranchId];

                result = (appBBranchLastDataTaskFinishedDate?.getTime() ?? 0) - (appABranchLastDataTaskFinishedDate?.getTime() ?? 0);
                break;
              }
            }

            if (appsSortingMode === AppsSortingMode.ByName || result === 0) {
              result = (appInfoA.name ?? "").localeCompare(appInfoB.name ?? "");
            }

            switch (appsSortingDirection) {
              case AppsSortingDirection.Asc: {
                return result;
              }
              case AppsSortingDirection.Desc: {
                return -result;
              }
            }
          },
        ),
      );
    },
    [
      appsFilteringMode,
      appsBranchesLastDataTaskFinishedDate,
      appsBranchesLastProcessStartedDate,
      appsDefaultBranchIdInfo,
      appsSortingDirection,
      appsSortingMode,
      filteredAppsInfo,
    ],
  );

  return (
    <div className="grid size-full animate-fade grid-cols-[1fr_auto] animate-duration-500 animate-ease-in">
      <div className="grid grid-rows-[auto_auto_1fr] overflow-hidden">
        <div className="flex flex-row items-center justify-between gap-6 px-12 py-6">
          <TypographyH1>Library</TypographyH1>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[300px] pl-8"
              value={appsSearchQuery}
              onChange={(e) => { setAppsSearchQuery(e.target.value.trimStart()); }}
            />
          </div>
        </div>
        <Separator />
        <ScrollArea>
          {
            Object.entries(sortedAppsInfo).length > 0
              ? (
                  <Suspense fallback={
                    (
                      <div className="flex size-full flex-col items-center justify-center">
                        <Spinner />
                      </div>
                    )
                  }
                  >
                    <div className="grid grid-cols-1 gap-6 px-12 py-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {
                        Object.entries(sortedAppsInfo).map(([appId, appInfo]) => (
                          <Suspense key={appId} fallback={<></>}>
                            <AppCard
                              appId={appId}
                              appInfo={appInfo}
                            />
                          </Suspense>
                        ))
                      }
                    </div>
                  </Suspense>
                )
              : (
                  <div className="flex size-full flex-col items-center justify-center">
                    <TypographyH3>
                      {
                        appsFilteringUserMode === AppsFilteringUserMode.Disabled
                          ? "There are no apps in your library."
                          : appsFilteringUserMode === AppsFilteringUserMode.OnlyFavourite
                            ? "There are no favourite apps in your library."
                            : "There are no installed apps in your library."
                      }
                    </TypographyH3>
                  </div>
                )
          }
        </ScrollArea>
      </div>
      <div
        className="flex w-36 flex-col gap-2 border-l p-4"
      >
        <TypographyMuted>Filter</TypographyMuted>
        <RadioGroup
          value={appsFilteringUserMode}
          onValueChange={(value) => {
            if (typia.is<AppsFilteringUserMode>(value)) {
              setAppsFilteringUserMode(value);
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AppsFilteringUserMode.Disabled} id="apps-filtering-user-mode-all" />
            <Label htmlFor="apps-filtering-user-mode-all">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AppsFilteringUserMode.OnlyFavourite} id="apps-filtering-user-mode-only-favourite" />
            <Label htmlFor="apps-filtering-user-mode-only-favourite">Favourite</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AppsFilteringUserMode.OnlyInstalled} id="apps-filtering-user-mode-only-installed" />
            <Label htmlFor="apps-filtering-user-mode-only-installed">Installed</Label>
          </div>
        </RadioGroup>
        <Separator />
        <div
          className="group flex cursor-pointer flex-row items-center justify-between"
          onClick={() => {
            setAppsSortingDirection(appsSortingDirection === AppsSortingDirection.Asc ? AppsSortingDirection.Desc : AppsSortingDirection.Asc);
          }}
        >
          <TypographyMuted>Sort</TypographyMuted>
          <TypographyMuted
            className="group-hover:text-primary"
          >
            {
              appsSortingDirection === AppsSortingDirection.Asc
                ? <ArrowDownIcon className="size-3" />
                : <ArrowUpIcon className="size-3" />
            }
          </TypographyMuted>
        </div>
        <RadioGroup
          value={appsSortingMode}
          onValueChange={(value) => {
            if (typia.is<AppsSortingMode>(value)) {
              setAppsSortingMode(value);
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AppsSortingMode.ByName} id="apps-sorting-mode-by-name" />
            <Label htmlFor="apps-sorting-mode-by-name">By Name</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AppsSortingMode.ByPlayed} id="apps-sorting-mode-by-played" />
            <Label htmlFor="apps-sorting-mode-by-played">By Played</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AppsSortingMode.ByUpdated} id="apps-sorting-mode-by-updated" />
            <Label htmlFor="apps-sorting-mode-by-updated">By Updated</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
