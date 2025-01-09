import {
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import typia from "typia";

import { fetchThemeVariant } from "@/lib/fetch-theme-variant";
import { ThemeVariant } from "@/lib/theme-variant";
import { ThemeVariantOption } from "@/lib/theme-variant-option";

interface ThemeVariantOptionStoreState {
  value: ThemeVariantOption;
}

const THEME_VARIANT_OPTION_STORE_STATE_LOCAL_STORAGE_KEY = "theme-variant-option-store-state";

const THEME_VARIANT_OPTION_STORE_DEFAULT_STATE: ThemeVariantOptionStoreState = {
  value: ThemeVariantOption.System,
};

function fetchThemeVariantOptionStoreState(): ThemeVariantOptionStoreState {
  const themeVariantOptionStoreStateAsJson = localStorage.getItem(THEME_VARIANT_OPTION_STORE_STATE_LOCAL_STORAGE_KEY);

  if (themeVariantOptionStoreStateAsJson === null) {
    return THEME_VARIANT_OPTION_STORE_DEFAULT_STATE;
  }

  try {
    const themeVariantOptionStoreState = JSON.parse(themeVariantOptionStoreStateAsJson) as unknown;

    if (!typia.is<ThemeVariantOptionStoreState>(themeVariantOptionStoreState)) {
      return THEME_VARIANT_OPTION_STORE_DEFAULT_STATE;
    }

    return themeVariantOptionStoreState;
  } catch {
    return THEME_VARIANT_OPTION_STORE_DEFAULT_STATE;
  }
}

function setThemeVariantOptionStoreState(
  {
    themeVariantOptionStoreState,
  }: {
    themeVariantOptionStoreState: ThemeVariantOptionStoreState;
  },
) {
  const themeVariantOptionStoreStateAsJson = JSON.stringify(themeVariantOptionStoreState);

  localStorage.setItem(THEME_VARIANT_OPTION_STORE_STATE_LOCAL_STORAGE_KEY, themeVariantOptionStoreStateAsJson);
}

interface ThemeVariantContextValue {
  themeVariant: ThemeVariant;
  themeVariantOption: ThemeVariantOption;
  setThemeVariantOption: ({}: { themeVariantOption: ThemeVariantOption }) => void;
  toggleThemeVariantOption: () => void;
};

export const ThemeVariantContext = createContext<ThemeVariantContextValue>(undefined!);

export function ThemeVariantContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [themeVariantOption, setThemeVariantOption] = useState<ThemeVariantOption>(
    fetchThemeVariantOptionStoreState().value,
  );

  const themeVariant = fetchThemeVariant({
    themeVariantOption,
  });

  useEffect(
    () => {
      const root = window.document.documentElement;

      root.classList.remove("light", "dark");

      switch (themeVariant) {
        case ThemeVariant.Dark: {
          root.classList.add("dark");
          break;
        }
        case ThemeVariant.Light: {
          root.classList.add("light");
          break;
        }
      }
    },
    [
      themeVariant,
    ],
  );

  const themeVariantContextValue = useMemo<ThemeVariantContextValue>(
    () => {
      return {
        themeVariant,
        themeVariantOption,
        setThemeVariantOption: (
          {
            themeVariantOption,
          },
        ) => {
          setThemeVariantOption(themeVariantOption);

          setThemeVariantOptionStoreState({
            themeVariantOptionStoreState: {
              value: themeVariantOption,
            },
          });
        },
        toggleThemeVariantOption: () => {
          let themeNewVariantOption: ThemeVariantOption;

          switch (themeVariant) {
            case ThemeVariant.Dark: {
              themeNewVariantOption = ThemeVariantOption.Light;
              break;
            }
            case ThemeVariant.Light: {
              themeNewVariantOption = ThemeVariantOption.Dark;
              break;
            }
          }

          setThemeVariantOption(themeNewVariantOption);

          setThemeVariantOptionStoreState({
            themeVariantOptionStoreState: {
              value: themeNewVariantOption,
            },
          });
        },
      };
    },
    [
      themeVariant,
      themeVariantOption,
    ],
  );

  return (
    <ThemeVariantContext.Provider value={themeVariantContextValue}>
      {children}
    </ThemeVariantContext.Provider>
  );
}
