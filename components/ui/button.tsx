/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-brand-800 text-white hover:bg-brand-700 shadow-sm",
        primary: "bg-brand-800 text-white hover:bg-brand-700 shadow-sm",
        accent: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline:
          "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        subtle: "bg-brand-50 text-brand-800 hover:bg-brand-100 border border-brand-100",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
