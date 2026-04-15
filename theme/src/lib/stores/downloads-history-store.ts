// Optional: This store is not required by the SDK. It provides persistent
// download history so the "Past Downloads" section in the downloads panel
// can show the task type (Installed vs Updated) and completion date —
// information that the SDK does not retain after a task finishes.
// Remove this store and the related UI if you don't need download history.

import * as zustand from "zustand";
import * as zustandMiddleware from "zustand/middleware";

export interface DownloadHistoryEntry {
  appId: string;
  appBranchId: string;
  taskType: "install" | "update" | "repair";
  completedDate: number;
}

interface DownloadsHistoryStoreState {
  entries: DownloadHistoryEntry[];
  addEntry: (entry: DownloadHistoryEntry) => void;
  completeEntry: (appId: string, appBranchId: string) => void;
  removeOngoingEntry: (appId: string, appBranchId: string) => void;
  clear: () => void;
}

const useDownloadsHistoryStore = zustand.create(
  zustandMiddleware.persist<DownloadsHistoryStoreState>(
    set => ({
      entries: [],
      addEntry: (entry) => {
        set(state => ({
          entries: [entry, ...state.entries],
        }));
      },
      completeEntry: (appId, appBranchId) => {
        set(state => ({
          entries: state.entries.map(e =>
            e.appId === appId && e.appBranchId === appBranchId && e.completedDate === 0
              ? { ...e, completedDate: Date.now() }
              : e,
          ),
        }));
      },
      removeOngoingEntry: (appId, appBranchId) => {
        set(state => ({
          entries: state.entries.filter(e =>
            !(e.appId === appId && e.appBranchId === appBranchId && e.completedDate === 0),
          ),
        }));
      },
      clear: () => {
        set(state => ({
          entries: state.entries.filter(e => e.completedDate === 0),
        }));
      },
    }),
    {
      name: "downloads-history",
    },
  ),
);

export function useDownloadsHistory() {
  return useDownloadsHistoryStore(state => state.entries);
}

export function useAddDownloadHistoryEntry() {
  return useDownloadsHistoryStore(state => state.addEntry);
}

export function useCompleteDownloadHistoryEntry() {
  return useDownloadsHistoryStore(state => state.completeEntry);
}

export function useRemoveOngoingDownloadHistoryEntry() {
  return useDownloadsHistoryStore(state => state.removeOngoingEntry);
}

export function useClearDownloadsHistory() {
  return useDownloadsHistoryStore(state => state.clear);
}
