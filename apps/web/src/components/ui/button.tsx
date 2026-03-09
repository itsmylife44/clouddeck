"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(79,70,229,0.4)]",
        secondary:
          "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
        danger:
          "bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_14px_0_rgba(239,68,68,0.3)]",
        ghost: "hover:bg-slate-100 text-slate-700",
        link: "text-[#4F46E5] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 rounded-lg",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-8 text-base rounded-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
