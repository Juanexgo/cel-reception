import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS } from "@/lib/constants";

/**
 * Full status distribution with progress bars.
 *
 * Shows ALL ReceptionStatus enum values so even an empty status reads as
 * "0 (0%)" rather than disappearing — useful when the operator scans for
 * "anything stuck in WAITING_PARTS?".
 */

const STATUS_BAR_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500",
  DIAGNOSING: "bg-yellow-500",
  WAITING_PARTS: "bg-orange-500",
  REPAIRING: "bg-purple-500",
  READY: "bg-green-500",
  DELIVERED: "bg-slate-500",
  CANCELLED: "bg-red-500",
};

export function StatusOverview({
  statusCounts,
}: {
  statusCounts: Record<string, number>;
}) {
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de las reparaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const count = statusCounts[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-gray-500">
                  {count}{" "}
                  <span className="text-xs text-gray-400">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full ${STATUS_BAR_COLORS[key] ?? "bg-gray-400"} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
