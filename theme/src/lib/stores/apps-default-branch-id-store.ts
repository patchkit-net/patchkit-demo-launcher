import { APP_MAIN_BRANCH_ID } from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import * as zustand from "zustand";
import * as zustandMiddleware from "zustand/middleware";

export interface AppDefaultBranchIdInfo {
  defaultBranchId: string;
}

export type SetAppDefaultBranchIdInfo = (
  {
  }: {
    appId: string;
    appDefaultBranchIdInfo: AppDefaultBranchIdInfo;
  },
) => void;

interface AppsDefaultBranchIdInfoStoreState {
  appsDefaultBranchIdInfo: {
    [appId: string]: AppDefaultBranchIdInfo;
  };
  setAppDefaultBranchIdInfo: SetAppDefaultBranchIdInfo;
}

const useAppsDefaultBranchIdInfoStore = zustand.create(
  zustandMiddleware.persist<AppsDefaultBranchIdInfoStoreState>(
    setAppsDefaultBranchIdInfoStoreState => ({
      appsDefaultBranchIdInfo: {},
      setAppDefaultBranchIdInfo: (
        {
          appId,
          appDefaultBranchIdInfo,
        },
      ) => {
        setAppsDefaultBranchIdInfoStoreState(x => ({
          ...x,
          appsDefaultBranchIdInfo: {
            ...x.appsDefaultBranchIdInfo,
            [appId]: appDefaultBranchIdInfo,
          },
        }));
      },
    }),
    {
      name: "apps-default-branch-id-info",
    },
  ),
);

export function useSetAppDefaultBranchIdInfo() {
  return useAppsDefaultBranchIdInfoStore(state => state.setAppDefaultBranchIdInfo);
}

export function useAppsDefaultBranchIdInfo() {
  return useAppsDefaultBranchIdInfoStore(state => state.appsDefaultBranchIdInfo);
}

export const APP_DEFAULT_BRANCH_ID_DEFAULT_INFO: AppDefaultBranchIdInfo = {
  defaultBranchId: APP_MAIN_BRANCH_ID.value,
};

export function useAppDefaultBranchIdInfo(
  {
    appId,
  }: {
    appId: string;
  },
) {
  return useAppsDefaultBranchIdInfoStore(state => state.appsDefaultBranchIdInfo[appId]) ?? APP_DEFAULT_BRANCH_ID_DEFAULT_INFO;
}
