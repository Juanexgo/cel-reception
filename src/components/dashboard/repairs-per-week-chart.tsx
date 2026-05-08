"use client";

import {
  BarChart,
  Bar,
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
 * Weekly intake bars for the last 8 weeks. Receives pre-bucketed data so
 * this client component does no parsing — keeps the JS bundle minimal and
 * respects the "do not over-engineer" constraint.
 */
export function RepairsPerWeekChart({
  data,
}: {
  data: Array<{ week: string; count: number }>;
}) {
  const empty = data.every((d) => d.count === 0);
  // Convert "2026-05-04" (Monday key) → "4 May" for the X axis label.
  const decorated = data.map((d) => ({ ...d, label: shortLabel(d.week) }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recepciones por semana</CardTitle>
        <CardDescription>Últimas 8 semanas</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyChart />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <BarChart
                data={decorated}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function shortLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function EmptyChart() {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-gray-500">
      Sin recepciones en este período.
    </div>
  );
}
