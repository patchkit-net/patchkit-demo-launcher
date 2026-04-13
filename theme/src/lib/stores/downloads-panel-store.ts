import * as zustand from "zustand";

interface DownloadsPanelStoreState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const useDownloadsPanelStore = zustand.create<DownloadsPanelStoreState>(
  set => ({
    isOpen: false,
    setIsOpen: (isOpen) => { set({ isOpen }); },
  }),
);

export function useIsDownloadsPanelOpen() {
  return useDownloadsPanelStore(state => state.isOpen);
}

export function useSetIsDownloadsPanelOpen() {
  return useDownloadsPanelStore(state => state.setIsOpen);
}
