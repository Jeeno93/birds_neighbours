import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { useThemeMode } from "@/context/ThemeContext";

/**
 * Returns design tokens for the active palette.
 *
 * Resolution order:
 *  - mode "light" → light palette (default)
 *  - mode "dark"  → dark palette
 *  - mode "system" → follows OS appearance
 */
export function useColors() {
  const { mode } = useThemeMode();
  const systemScheme = useColorScheme();

  const effective =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const palette = effective === "dark" ? colors.dark : colors.light;

  return { ...palette, radius: colors.radius };
}
