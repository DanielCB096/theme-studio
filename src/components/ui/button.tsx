import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[color,background-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-contrast hover:opacity-90",
        secondary: "bg-secondary text-secondary-contrast hover:opacity-90",
        outline: "border bg-surface text-fg hover:bg-background",
        ghost: "text-fg hover:bg-border",
        danger: "bg-danger text-danger-contrast hover:opacity-90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[var(--btn-height-default)] px-[var(--btn-padding-default)] text-[length:var(--btn-font-size-default)]",
        sm: "h-btn-sm px-[var(--btn-padding-sm)] text-sm",
        md: "h-btn-md px-[var(--btn-padding-md)] text-base",
        lg: "h-btn-lg px-[var(--btn-padding-lg)] text-lg",
        icon: "h-[var(--btn-height-default)] w-[var(--btn-height-default)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
