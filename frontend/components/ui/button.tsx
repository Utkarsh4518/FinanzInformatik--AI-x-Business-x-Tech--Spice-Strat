import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-fi-gradient text-white hover:opacity-90 shadow-md shadow-fi-red/20",
  secondary: "border border-white/[0.10] bg-white/[0.05] text-fi-text hover:bg-white/[0.09] backdrop-blur-xl",
  ghost: "text-fi-text/50 hover:bg-white/[0.06] hover:text-fi-text",
  accent: "accent-bg accent-border accent-text border hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-9 px-4 text-sm",
  sm: "h-7 px-2.5 text-xs rounded-lg",
  lg: "h-10 px-5 text-sm",
  icon: "h-8 w-8 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
);
Button.displayName = "Button";
