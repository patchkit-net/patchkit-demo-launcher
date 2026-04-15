import * as zustand from "zustand";
import * as zustandMiddleware from "zustand/middleware";

interface AppIsFavouriteInfo {
  isFavourite: boolean;
}

interface AppsIsFavouriteInfoStoreState {
  appsIsFavouriteInfo: {
    [appId: string]: AppIsFavouriteInfo;
  };
  setAppIsFavouriteInfo: (
    {
    }: {
      appId: string;
      appIsFavouriteInfo: AppIsFavouriteInfo;
    },
  ) => void;
}

const useAppsIsFavouriteInfoStore = zustand.create(
  zustandMiddleware.persist<AppsIsFavouriteInfoStoreState>(
    setAppsIsFavouriteInfoStoreState => ({
      appsIsFavouriteInfo: {},
      setAppIsFavouriteInfo: (
        {
          appId,
          appIsFavouriteInfo,
        },
      ) => {
        setAppsIsFavouriteInfoStoreState(x => ({
          ...x,
          appsIsFavouriteInfo: {
            ...x.appsIsFavouriteInfo,
            [appId]: appIsFavouriteInfo,
          },
        }));
      },
    }),
    {
      name: "apps-is-favourite-info",
    },
  ),
);

export function useSetAppIsFavouriteInfo() {
  return useAppsIsFavouriteInfoStore(state => state.setAppIsFavouriteInfo);
}

export function useAppsIsFavouriteInfo() {
  return useAppsIsFavouriteInfoStore(state => state.appsIsFavouriteInfo);
}

const APP_IS_FAVOURITE_DEFAULT_INFO: AppIsFavouriteInfo = {
  isFavourite: false,
};

export function useAppIsFavouriteInfo(
  {
    appId,
  }: {
    appId: string;
  },
) {
  return useAppsIsFavouriteInfoStore(state => state.appsIsFavouriteInfo[appId]) ?? APP_IS_FAVOURITE_DEFAULT_INFO;
}
