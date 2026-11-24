import { Moon, RotateCcw, Sun, Undo2, Redo2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ColorControl } from "@/features/editor/controls/ColorControl";
import { SliderControl } from "@/features/editor/controls/SliderControl";
import { ExportThemeDialog } from "@/features/themes/ExportThemeDialog";
import { ImportThemeDialog } from "@/features/themes/ImportThemeDialog";
import { useThemeStore } from "@/store/themeStore";
import {
  BUTTON_SIZE_LABELS,
  BUTTON_SIZES,
  COLOR_KEYS,
  DENSITIES,
  DENSITY_LABELS,
  FONT_FAMILY_KEYS,
  FONT_FAMILY_LABELS,
  THEME_LIMITS,
  type ThemeMode,
} from "@/types/theme";
import { cn } from "@/lib/utils";

export function EditorPanel() {
  return (
    <aside
      aria-label="Controles del tema"
      className="w-full shrink-0 overflow-y-auto border-b bg-surface p-density lg:h-full lg:w-80 lg:border-b-0 lg:border-r"
    >
      <div className="space-y-density">
        <ModeSection />
        <Section title="Colores" id="section-colores">
          <div className="grid grid-cols-1 gap-density @md:grid-cols-2 lg:grid-cols-1">
            {COLOR_KEYS.map((key) => (
              <ColorControl key={key} colorKey={key} />
            ))}
          </div>
        </Section>

        <Section title="Tipografía" id="section-tipografia">
          <TypographyFields />
        </Section>

        <Section title="Forma" id="section-forma">
          <ShapeFields />
        </Section>

        <Section title="Espaciado" id="section-espaciado">
          <SpacingFields />
        </Section>

        <Section title="Componentes" id="section-componentes">
          <ComponentFields />
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ModeSection() {
  const mode = useThemeStore((state) => state.theme.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
  ];

  return (
    <div
      role="group"
      aria-label="Modo del tema"
      className="grid grid-cols-2 gap-1 rounded-md border bg-background p-1"
    >
      {options.map(({ value, label: optionLabel, icon: Icon }) => {
        const pressed = mode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={pressed}
            onClick={() => setMode(value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              pressed
                ? "bg-primary text-primary-contrast"
                : "text-muted hover:bg-surface hover:text-fg",
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}

function TypographyFields() {
  const fontFamily = useThemeStore((state) => state.theme.typography.fontFamily);
  const baseSize = useThemeStore((state) => state.theme.typography.baseSize);
  const scale = useThemeStore((state) => state.theme.typography.scale);
  const setFontFamily = useThemeStore((state) => state.setFontFamily);
  const setBaseSize = useThemeStore((state) => state.setBaseSize);
  const setScale = useThemeStore((state) => state.setScale);

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="font-family">Fuente</Label>
        <Select
          id="font-family"
          value={fontFamily}
          onChange={(event) => {
            const next = FONT_FAMILY_KEYS.find((key) => key === event.target.value);
            if (next) setFontFamily(next);
          }}
        >
          {FONT_FAMILY_KEYS.map((key) => (
            <option key={key} value={key}>
              {FONT_FAMILY_LABELS[key]}
            </option>
          ))}
        </Select>
      </div>

      <SliderControl
        id="base-size"
        label="Tamaño base"
        value={baseSize}
        min={THEME_LIMITS.baseSize.min}
        max={THEME_LIMITS.baseSize.max}
        suffix=" px"
        onChange={setBaseSize}
      />
      <SliderControl
        id="type-scale"
        label="Escala tipográfica"
        value={scale}
        min={THEME_LIMITS.scale.min}
        max={THEME_LIMITS.scale.max}
        step={0.05}
        suffix="×"
        onChange={setScale}
      />
    </>
  );
}

function ShapeFields() {
  const radius = useThemeStore((state) => state.theme.shape.radius);
  const borderWidth = useThemeStore((state) => state.theme.shape.borderWidth);
  const setRadius = useThemeStore((state) => state.setRadius);
  const setBorderWidth = useThemeStore((state) => state.setBorderWidth);

  return (
    <>
      <SliderControl
        id="radius"
        label="Radio de borde"
        value={radius}
        min={THEME_LIMITS.radius.min}
        max={THEME_LIMITS.radius.max}
        suffix=" px"
        onChange={setRadius}
      />
      <SliderControl
        id="border-width"
        label="Grosor del borde"
        value={borderWidth}
        min={THEME_LIMITS.borderWidth.min}
        max={THEME_LIMITS.borderWidth.max}
        suffix=" px"
        onChange={setBorderWidth}
      />
    </>
  );
}

function SpacingFields() {
  const unit = useThemeStore((state) => state.theme.spacing.unit);
  const setSpaceUnit = useThemeStore((state) => state.setSpaceUnit);

  return (
    <SliderControl
      id="space-unit"
      label="Unidad de espaciado"
      value={unit}
      min={THEME_LIMITS.spaceUnit.min}
      max={THEME_LIMITS.spaceUnit.max}
      suffix=" px"
      onChange={setSpaceUnit}
    />
  );
}

function ComponentFields() {
  const density = useThemeStore((state) => state.theme.components.density);
  const buttonSize = useThemeStore((state) => state.theme.components.buttonSize);
  const setDensity = useThemeStore((state) => state.setDensity);
  const setButtonSize = useThemeStore((state) => state.setButtonSize);

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="density">Densidad</Label>
        <Select
          id="density"
          value={density}
          onChange={(event) => {
            const next = DENSITIES.find((value) => value === event.target.value);
            if (next) setDensity(next);
          }}
        >
          {DENSITIES.map((value) => (
            <option key={value} value={value}>
              {DENSITY_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="button-size">Tamaño de botón</Label>
        <Select
          id="button-size"
          value={buttonSize}
          onChange={(event) => {
            const next = BUTTON_SIZES.find((value) => value === event.target.value);
            if (next) setButtonSize(next);
          }}
        >
          {BUTTON_SIZES.map((value) => (
            <option key={value} value={value}>
              {BUTTON_SIZE_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}

export function EditorHeader() {
  return (
    <header className="flex flex-wrap items-center gap-density border-b bg-surface px-density py-3">
      <div className="mr-auto flex min-w-0 items-baseline gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Theme Studio</h1>
        <span className="hidden text-xs text-muted sm:inline">editor de temas</span>
        <span className="hidden items-center gap-1.5 text-xs text-muted md:inline-flex">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
          Borrador autoguardado
        </span>
      </div>

      <ThemeNameField />
      <UndoRedoButtons />
      <ResetButton />
      <ImportThemeDialog />
      <ExportThemeDialog />
    </header>
  );
}

function ThemeNameField() {
  const name = useThemeStore((state) => state.theme.name);
  const setName = useThemeStore((state) => state.setName);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      setDraft(name);
      return;
    }
    setName(trimmed);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Label htmlFor="theme-name" className="sr-only">
        Nombre del tema
      </Label>
      <Input
        id="theme-name"
        value={draft}
        maxLength={THEME_LIMITS.nameMaxLength}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        className="w-48"
      />
    </form>
  );
}

function UndoRedoButtons() {
  const canUndo = useThemeStore((state) => state.past.length > 0);
  const canRedo = useThemeStore((state) => state.future.length > 0);
  const undo = useThemeStore((state) => state.undo);
  const redo = useThemeStore((state) => state.redo);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Deshacer"
        title="Deshacer (Ctrl/Cmd+Z)"
      >
        <Undo2 aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Rehacer"
        title="Rehacer (Ctrl/Cmd+Shift+Z)"
      >
        <Redo2 aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ResetButton() {
  const reset = useThemeStore((state) => state.reset);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={reset}
      title="Restablecer el tema (se puede deshacer)"
    >
      <RotateCcw aria-hidden="true" className="h-4 w-4" />
      Restablecer
    </Button>
  );
}
