"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({
  fallback,
  className,
  title,
  children,
}: {
  fallback: string;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <button
      title={title}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className={className}
    >
      {children ?? (
        <>
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali
        </>
      )}
    </button>
  );
}