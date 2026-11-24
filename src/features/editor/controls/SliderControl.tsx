import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SliderControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Sufijo del valor mostrado (px, ×, …). */
  suffix?: string;
  onChange: (value: number) => void;
}

export function SliderControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: SliderControlProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <output htmlFor={id} className="font-mono text-xs text-muted">
          {value}
          {suffix}
        </output>
      </div>
      <Slider
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        thumbLabel={label}
        onValueChange={(next) => {
          const first = next[0];
          if (first !== undefined) onChange(first);
        }}
      />
    </div>
  );
}
