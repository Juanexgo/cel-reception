import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Compact KPI card. Server Component — no interactivity, just data display.
 *
 * Tone keys map to Tailwind palettes from the existing STATUS_COLORS so the
 * dashboard reads consistently with the rest of the app (badges, status pills).
 */
const TONES = {
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
  slate: "bg-slate-100 text-slate-700",
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
} as const;
export type KpiTone = keyof typeof TONES;

export function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  tone?: KpiTone;
}) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start justify-between gap-2 p-3 sm:gap-3 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
            {label}
          </p>
          <p className="mt-0.5 truncate text-lg font-bold tracking-tight sm:mt-1 sm:text-2xl">
            {value}
          </p>
          {helper ? (
            <p className="mt-0.5 truncate text-[10px] text-gray-500 sm:text-xs">
              {helper}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
            TONES[tone]
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
