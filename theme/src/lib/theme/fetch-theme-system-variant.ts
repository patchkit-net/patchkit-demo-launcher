import { ThemeVariant } from "./theme-variant";

export function fetchThemeSystemVariant(): ThemeVariant {
  return window.matchMedia("(prefers-color-scheme: dark)")
    .matches
    ? ThemeVariant.Dark
    : ThemeVariant.Light;
}
