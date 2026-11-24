import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_THEME, DEFAULT_THEMES } from "@/lib/defaultThemes";
import { HISTORY_LIMIT, MERGE_WINDOW_MS, createThemeStore } from "@/store/themeStore";

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("themeStore", () => {
  let now = 1_000;

  beforeEach(() => {
    now = 1_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("arranca con el tema por defecto y sin historial", () => {
    const store = createThemeStore();
    expect(store.getState().theme).toEqual(DEFAULT_THEME);
    expect(store.getState().past).toHaveLength(0);
    expect(store.getState().future).toHaveLength(0);
  });

  it("normaliza el hex a minúsculas e ignora valores inválidos", () => {
    const store = createThemeStore();
    store.getState().setColor("primary", "#ABCDEF");
    expect(store.getState().theme.colors.primary).toBe("#abcdef");

    store.getState().setColor("primary", "rojo");
    expect(store.getState().theme.colors.primary).toBe("#abcdef");
    expect(store.getState().past).toHaveLength(1);
  });

  it("deshace y rehace cambios", () => {
    const store = createThemeStore();
    store.getState().setRadius(20);
    expect(store.getState().theme.shape.radius).toBe(20);

    store.getState().undo();
    expect(store.getState().theme.shape.radius).toBe(10);
    expect(store.getState().future).toHaveLength(1);

    store.getState().redo();
    expect(store.getState().theme.shape.radius).toBe(20);
    expect(store.getState().future).toHaveLength(0);
  });

  it("descarta el futuro al hacer un cambio nuevo", () => {
    const store = createThemeStore();
    store.getState().setRadius(20);
    store.getState().undo();
    expect(store.getState().future).toHaveLength(1);

    now += MERGE_WINDOW_MS + 1;
    store.getState().setBorderWidth(3);
    expect(store.getState().future).toHaveLength(0);
  });

  it("agrupa cambios rápidos de la misma propiedad en un solo paso", () => {
    const store = createThemeStore();
    store.getState().setRadius(12);
    now += 100;
    store.getState().setRadius(13);
    now += 100;
    store.getState().setRadius(14);
    expect(store.getState().past).toHaveLength(1);
    expect(store.getState().theme.shape.radius).toBe(14);

    store.getState().undo();
    expect(store.getState().theme.shape.radius).toBe(10);
  });

  it("no agrupa cambios separados más que la ventana de mezcla", () => {
    const store = createThemeStore();
    store.getState().setRadius(12);
    now += MERGE_WINDOW_MS + 1;
    store.getState().setRadius(13);
    expect(store.getState().past).toHaveLength(2);
  });

  it("acota el historial a 50 estados", () => {
    const store = createThemeStore();
    for (let index = 0; index < HISTORY_LIMIT + 10; index += 1) {
      now += MERGE_WINDOW_MS + 1;
      store.getState().setRadius(index % 25);
    }
    expect(store.getState().past).toHaveLength(HISTORY_LIMIT);

    for (let index = 0; index < HISTORY_LIMIT; index += 1) {
      store.getState().undo();
    }
    expect(store.getState().past).toHaveLength(0);
    expect(store.getState().future).toHaveLength(HISTORY_LIMIT);

    store.getState().undo();
    expect(store.getState().past).toHaveLength(0);
  });

  it("recorta los valores numéricos a su rango", () => {
    const store = createThemeStore();
    store.getState().setRadius(999);
    expect(store.getState().theme.shape.radius).toBe(24);

    now += MERGE_WINDOW_MS + 1;
    store.getState().setBaseSize(2);
    expect(store.getState().theme.typography.baseSize).toBe(12);

    now += MERGE_WINDOW_MS + 1;
    store.getState().setScale(99);
    expect(store.getState().theme.typography.scale).toBe(1.5);
  });

  it("aplica colores en bloque con un solo paso de historial", () => {
    const store = createThemeStore();
    store.getState().applyColors({
      primary: "#111111",
      secondary: "#222222",
      background: "#333333",
      surface: "#444444",
      text: "#555555",
      muted: "#666666",
      border: "#777777",
      success: "#888888",
      danger: "#999999",
    });
    expect(store.getState().theme.colors.primary).toBe("#111111");
    expect(store.getState().past).toHaveLength(1);
  });

  it("ignora nombres vacíos y trunca nombres largos", () => {
    const store = createThemeStore();
    store.getState().setName("   ");
    expect(store.getState().theme.name).toBe("Claro por defecto");

    store.getState().setName("x".repeat(120));
    expect(store.getState().theme.name).toHaveLength(80);
  });

  it("cambia de modo conservando los colores de marca", () => {
    const store = createThemeStore();
    store.getState().setColor("primary", "#ff0000");
    now += MERGE_WINDOW_MS + 1;
    store.getState().setMode("dark");

    const { theme } = store.getState();
    expect(theme.mode).toBe("dark");
    expect(theme.colors.primary).toBe("#ff0000");
    expect(theme.colors.background).toBe(DEFAULT_THEMES.dark.colors.background);
    expect(theme.colors.text).toBe(DEFAULT_THEMES.dark.colors.text);
  });

  it("restablece los valores por defecto conservando el nombre", () => {
    const store = createThemeStore();
    store.getState().setName("Mi tema");
    now += MERGE_WINDOW_MS + 1;
    store.getState().setRadius(22);
    now += MERGE_WINDOW_MS + 1;
    store.getState().reset();

    expect(store.getState().theme.shape.radius).toBe(10);
    expect(store.getState().theme.name).toBe("Mi tema");
    expect(store.getState().past.length).toBeGreaterThan(0);
  });

  it("carga un tema y limpia el historial", () => {
    const store = createThemeStore();
    store.getState().setRadius(22);
    const fresh = { ...DEFAULT_THEMES.dark, name: "Cargado" };
    store.getState().loadTheme(fresh);

    expect(store.getState().theme).toEqual(fresh);
    expect(store.getState().past).toHaveLength(0);
    expect(store.getState().future).toHaveLength(0);
  });

  it("persiste el tema y lo rehidrata validándolo", () => {
    const storage = new MemoryStorage();
    const options = { enablePersist: true, storage, storageName: "test" };

    const first = createThemeStore(options);
    first.getState().setColor("primary", "#123456");

    const second = createThemeStore(options);
    expect(second.getState().theme.colors.primary).toBe("#123456");
  });

  it("descarta un borrador persistido inválido", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "test",
      JSON.stringify({
        version: 1,
        state: { theme: { ...DEFAULT_THEME, shape: { radius: 999, borderWidth: 1 } } },
      }),
    );

    const store = createThemeStore({ enablePersist: true, storage, storageName: "test" });
    expect(store.getState().theme.shape.radius).toBe(10);
  });
});
