import { fetchThemeSystemVariant } from "./fetch-theme-system-variant";
import { ThemeVariant } from "./theme-variant";
import { ThemeVariantOption } from "./theme-variant-option";

export function fetchThemeVariant(
  {
    themeVariantOption,
  }: {
    themeVariantOption: ThemeVariantOption;
  },
): ThemeVariant {
  switch (themeVariantOption) {
    case ThemeVariantOption.System:
      return fetchThemeSystemVariant();
    case ThemeVariantOption.Dark:
      return ThemeVariant.Dark;
    case ThemeVariantOption.Light:
      return ThemeVariant.Light;
  }
}
