import { Plus, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function TextField({
  label,
  value,
  onChange,
  maxLength = 120,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  maxLength = 500,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  rows?: number;
}) {
  const id = `field-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  const id = `field-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={String(value)}
        onChange={(event) => {
          const next = options.find((option) => String(option.value) === event.target.value);
          if (next) onChange(next.value);
        }}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function ToggleField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = `field-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="text-xs text-muted">{description}</p> : null}
      </div>
      <Switch id={id} checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export function ListField<T>({
  label,
  items,
  onChange,
  create,
  max,
  itemLabel,
  children,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  max: number;
  itemLabel: (item: T, index: number) => string;
  children: (item: T, update: (next: T) => void, index: number) => ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={items.length >= max}
          onClick={() => onChange([...items, create()])}
          aria-label={`Añadir ${label.toLowerCase()}`}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Añadir
        </Button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-md border bg-background p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted">{itemLabel(item, index)}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ${label.toLowerCase()} ${index + 1}`}
              disabled={items.length <= 1}
              onClick={() => onChange(items.filter((_, current) => current !== index))}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
          {children(
            item,
            (next) => {
              onChange(items.map((current, position) => (position === index ? next : current)));
            },
            index,
          )}
        </div>
      ))}
    </div>
  );
}
