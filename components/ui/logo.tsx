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
    <span className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-patramind.png"
        alt="PATRAMIND — Intelligent Procurement Workspace"
        className={cn(
          "w-auto select-none",
          size === "sm" && "h-9",
          size === "md" && "h-11",
          size === "lg" && "h-14",
          className,
          dark && "drop-shadow-[0_2px_10px_rgba(1,57,160,0.45)]"
        )}
      />
    </span>
  );
}