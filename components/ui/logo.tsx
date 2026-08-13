import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  dark = false,
  size = "md",
  className,
}: {
  dark?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-white shadow-sm",
          size === "sm" && "h-7 w-7",
          size === "md" && "h-9 w-9",
          size === "lg" && "h-12 w-12"
        )}
      >
        <BrainCircuit
          className={cn(
            size === "sm" && "h-4 w-4",
            size === "md" && "h-5 w-5",
            size === "lg" && "h-6 w-6"
          )}
        />
      </span>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-extrabold tracking-tight",
            dark ? "text-white" : "text-brand-900",
            size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-xl"
          )}
        >
          PATRA<span className="text-red-600">MIND</span>
        </span>
        <span
          className={cn(
            "text-[10px] font-medium tracking-wide",
            dark ? "text-brand-200" : "text-slate-500"
          )}
        >
          Intelligent Procurement Workspace
        </span>
      </div>
    </div>
  );
}
