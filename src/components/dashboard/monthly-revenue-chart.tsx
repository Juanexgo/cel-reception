"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Trailing 6-month revenue. Area chart conveys "trend" better than bars for
 * a money series and stays compact at 14rem tall.
 */
export function MonthlyRevenueChart({
  data,
}: {
  data: Array<{ month: string; total: number }>;
}) {
  const empty = data.every((d) => d.total === 0);
  const decorated = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos mensuales</CardTitle>
        <CardDescription>Últimos 6 meses (MXN)</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyChart />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <AreaChart
                data={decorated}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={11}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                  }
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value);
                    return Number.isFinite(n)
                      ? n.toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                          maximumFractionDigits: 0,
                        })
                      : String(value);
                  }}
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function monthLabel(key: string): string {
  // "2026-05" → May
  const [y, m] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("es-MX", {
    month: "short",
  });
}

function EmptyChart() {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-gray-500">
      Sin pagos registrados aún.
    </div>
  );
}
