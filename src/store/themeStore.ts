import { create, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { normalizeHex } from "@/lib/color";
import { DEFAULT_THEME, DEFAULT_THEMES } from "@/lib/defaultThemes";
import { themeSchema } from "@/lib/themeSchema";
import {
  THEME_LIMITS,
  type ButtonSize,
  type ColorKey,
  type Density,
  type FontFamily,
  type Theme,
  type ThemeColors,
  type ThemeMode,
} from "@/types/theme";

export const HISTORY_LIMIT = 50;
/** Cambios con la misma clave dentro de esta ventana se agrupan en un solo paso. */
export const MERGE_WINDOW_MS = 600;
export const DRAFT_STORAGE_KEY = "theme-studio:draft";

interface HistoryState {
  theme: Theme;
  past: Theme[];
  future: Theme[];
  lastMergeKey: string | null;
  lastCommitAt: number;
}

export interface ThemeActions {
  setColor: (key: ColorKey, value: string) => void;
  setRadius: (value: number) => void;
  setBorderWidth: (value: number) => void;
  setBaseSize: (value: number) => void;
  setScale: (value: number) => void;
  setSpaceUnit: (value: number) => void;
  setFontFamily: (value: FontFamily) => void;
  setDensity: (value: Density) => void;
  setButtonSize: (value: ButtonSize) => void;
  setName: (value: string) => void;
  setMode: (mode: ThemeMode) => void;
  applyColors: (colors: ThemeColors) => void;
  loadTheme: (theme: Theme) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
}

export type ThemeStore = HistoryState & ThemeActions;

export interface CreateThemeStoreOptions {
  initialTheme?: Theme;
  enablePersist?: boolean;
  storage?: Storage;
  storageName?: string;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Neutros que se intercambian al cambiar de modo; las marcas de color se conservan. */
function applyModeToNeutrals(theme: Theme, mode: ThemeMode): Theme {
  const palette = DEFAULT_THEMES[mode].colors;
  return {
    ...theme,
    mode,
    colors: {
      ...theme.colors,
      background: palette.background,
      surface: palette.surface,
      text: palette.text,
      muted: palette.muted,
      border: palette.border,
    },
  };
}

export function createThemeStore(
  options: CreateThemeStoreOptions = {},
): UseBoundStore<StoreApi<ThemeStore>> {
  const {
    initialTheme = DEFAULT_THEME,
    enablePersist = false,
    storage,
    storageName = DRAFT_STORAGE_KEY,
  } = options;

  const creator = (
    set: StoreApi<ThemeStore>["setState"],
    get: StoreApi<ThemeStore>["getState"],
  ): ThemeStore => {
    const commit = (next: Theme, mergeKey?: string) => {
      const state = get();
      if (next === state.theme) return;

      const now = Date.now();
      const canMerge =
        mergeKey !== undefined &&
        mergeKey === state.lastMergeKey &&
        now - state.lastCommitAt <= MERGE_WINDOW_MS;

      set({
        theme: next,
        past: canMerge ? state.past : [...state.past, state.theme].slice(-HISTORY_LIMIT),
        future: [],
        lastMergeKey: mergeKey ?? null,
        lastCommitAt: now,
      });
    };

    const update = (mergeKey: string | undefined, recipe: (theme: Theme) => Theme) => {
      commit(recipe(get().theme), mergeKey);
    };

    return {
      theme: initialTheme,
      past: [],
      future: [],
      lastMergeKey: null,
      lastCommitAt: 0,

      setColor: (key, value) => {
        const hex = normalizeHex(value);
        if (!hex) return;
        update(`colors.${key}`, (theme) => ({
          ...theme,
          colors: { ...theme.colors, [key]: hex },
        }));
      },

      setRadius: (value) =>
        update("shape.radius", (theme) => ({
          ...theme,
          shape: {
            ...theme.shape,
            radius: clamp(value, THEME_LIMITS.radius.min, THEME_LIMITS.radius.max),
          },
        })),

      setBorderWidth: (value) =>
        update("shape.borderWidth", (theme) => ({
          ...theme,
          shape: {
            ...theme.shape,
            borderWidth: clamp(value, THEME_LIMITS.borderWidth.min, THEME_LIMITS.borderWidth.max),
          },
        })),

      setBaseSize: (value) =>
        update("typography.baseSize", (theme) => ({
          ...theme,
          typography: {
            ...theme.typography,
            baseSize: clamp(value, THEME_LIMITS.baseSize.min, THEME_LIMITS.baseSize.max),
          },
        })),

      setScale: (value) =>
        update("typography.scale", (theme) => {
          const rounded = Math.round(value * 100) / 100;
          return {
            ...theme,
            typography: {
              ...theme.typography,
              scale: clamp(rounded, THEME_LIMITS.scale.min, THEME_LIMITS.scale.max),
            },
          };
        }),

      setSpaceUnit: (value) =>
        update("spacing.unit", (theme) => ({
          ...theme,
          spacing: {
            unit: clamp(value, THEME_LIMITS.spaceUnit.min, THEME_LIMITS.spaceUnit.max),
          },
        })),

      setFontFamily: (value) =>
        update(undefined, (theme) => ({
          ...theme,
          typography: { ...theme.typography, fontFamily: value },
        })),

      setDensity: (value) =>
        update(undefined, (theme) => ({
          ...theme,
          components: { ...theme.components, density: value },
        })),

      setButtonSize: (value) =>
        update(undefined, (theme) => ({
          ...theme,
          components: { ...theme.components, buttonSize: value },
        })),

      setName: (value) => {
        const name = value.slice(0, THEME_LIMITS.nameMaxLength);
        if (name.trim().length === 0) return;
        update("name", (theme) => ({ ...theme, name }));
      },

      setMode: (mode) => {
        if (get().theme.mode === mode) return;
        update("mode", (theme) => applyModeToNeutrals(theme, mode));
      },

      applyColors: (colors) =>
        update(undefined, (theme) => ({ ...theme, colors: { ...theme.colors, ...colors } })),

      loadTheme: (theme) => {
        set({
          theme,
          past: [],
          future: [],
          lastMergeKey: null,
          lastCommitAt: 0,
        });
      },

      reset: () => {
        update(undefined, (theme) => ({
          ...DEFAULT_THEMES[theme.mode],
          name: theme.name,
        }));
      },

      undo: () => {
        const { past, future, theme } = get();
        const previous = past[past.length - 1];
        if (!previous) return;
        set({
          theme: previous,
          past: past.slice(0, -1),
          future: [theme, ...future].slice(0, HISTORY_LIMIT),
          lastMergeKey: null,
          lastCommitAt: 0,
        });
      },

      redo: () => {
        const { future, past, theme } = get();
        const next = future[0];
        if (!next) return;
        set({
          theme: next,
          future: future.slice(1),
          past: [...past, theme].slice(-HISTORY_LIMIT),
          lastMergeKey: null,
          lastCommitAt: 0,
        });
      },
    };
  };

  if (!enablePersist) {
    return create<ThemeStore>()(creator);
  }

  const persistOptions = {
    name: storageName,
    version: 1,
    // Solo el tema: historial y marcas de tiempo no se guardan.
    partialize: (state: ThemeStore) => ({ theme: state.theme }),
    // Lo persistido es dato externo: se valida antes de confiar en él.
    merge: (persisted: unknown, current: ThemeStore): ThemeStore => {
      const candidate = (persisted as { theme?: unknown } | undefined)?.theme;
      const parsed = themeSchema.safeParse(candidate);
      return parsed.success ? { ...current, theme: parsed.data } : current;
    },
    ...(storage ? { storage: createJSONStorage(() => storage) } : {}),
  };

  return create<ThemeStore>()(persist(creator, persistOptions));
}

export const useThemeStore = createThemeStore({ enablePersist: true });
