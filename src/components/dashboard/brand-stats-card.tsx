import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BRAND_LABELS } from "@/lib/constants";

/**
 * Top brands by reception count. Plain horizontal bars (no Recharts) — at 5
 * data points a chart library is overkill and a bar list reads faster.
 */
export function BrandStatsCard({
  brands,
}: {
  brands: Array<{ brand: string; count: number }>;
}) {
  const max = Math.max(1, ...brands.map((b) => b.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marcas más reparadas</CardTitle>
        <CardDescription>Top 5 históricas</CardDescription>
      </CardHeader>
      <CardContent>
        {brands.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">Sin datos aún.</p>
        ) : (
          <ul className="space-y-2">
            {brands.map((b) => {
              const pct = Math.max(4, Math.round((b.count / max) * 100));
              return (
                <li key={b.brand}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium">
                      {BRAND_LABELS[b.brand] ?? b.brand}
                    </span>
                    <span className="text-gray-500">{b.count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
