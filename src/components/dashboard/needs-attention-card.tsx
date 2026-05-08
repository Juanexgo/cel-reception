import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  UserX,
  PhoneOff,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { ReceptionStats } from "@/repositories/reception-repository";

/**
 * Surfaces operationally important items so the operator doesn't have to
 * scan tables to find what's stuck. We cap each subsection at the top 5 to
 * avoid overwhelming the dashboard — the rest is a click away in /receptions.
 */
type AlertRow = { id: string; folio: string; primary: string; secondary: string };

export function NeedsAttentionCard({ stats }: { stats: ReceptionStats }) {
  const waiting = stats.waitingTooLong.map<AlertRow>((r) => {
    const days = daysAgo(r.createdAt);
    return {
      id: r.id,
      folio: r.folio,
      primary: `${r.client.name} · ${BRAND_LABELS[r.brand] ?? r.brand} ${r.model}`,
      secondary: `Sin avance hace ${days} días · ${
        STATUS_LABELS[r.status] ?? r.status
      }`,
    };
  });

  const ready = stats.readyTooLong.map<AlertRow>((r) => {
    const days = daysAgo(r.updatedAt);
    return {
      id: r.id,
      folio: r.folio,
      primary: `${r.client.name} · ${BRAND_LABELS[r.brand] ?? r.brand} ${r.model}`,
      secondary: `Listo desde hace ${days} días · ${r.client.phone || "sin teléfono"}`,
    };
  });

  const noTech = stats.needsAttention
    .filter((r) => !r.technicianId)
    .map<AlertRow>((r) => ({
      id: r.id,
      folio: r.folio,
      primary: `${r.client.name} · ${BRAND_LABELS[r.brand] ?? r.brand} ${r.model}`,
      secondary: STATUS_LABELS[r.status] ?? r.status,
    }));

  const noPhone = stats.needsAttention
    .filter((r) => !r.client.phone)
    .map<AlertRow>((r) => ({
      id: r.id,
      folio: r.folio,
      primary: `${r.client.name} · ${BRAND_LABELS[r.brand] ?? r.brand} ${r.model}`,
      secondary: "Cliente sin teléfono",
    }));

  const totalAlerts =
    waiting.length + ready.length + noTech.length + noPhone.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Necesita atención
            </CardTitle>
            <CardDescription>
              Reparaciones e información que conviene revisar
            </CardDescription>
          </div>
          {totalAlerts > 0 ? (
            <Badge className="bg-amber-100 text-amber-800">{totalAlerts}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalAlerts === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/30 p-4 text-sm text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Todo en orden — sin alertas operativas.
          </div>
        ) : (
          <>
            <AlertGroup
              icon={Clock}
              tone="amber"
              title="Reparaciones lentas (>7 días)"
              rows={waiting}
            />
            <AlertGroup
              icon={CheckCircle2}
              tone="green"
              title="Listas sin recoger (>3 días)"
              rows={ready}
            />
            <AlertGroup
              icon={UserX}
              tone="violet"
              title="Sin técnico asignado"
              rows={noTech}
            />
            <AlertGroup
              icon={PhoneOff}
              tone="rose"
              title="Cliente sin teléfono"
              rows={noPhone}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AlertGroup({
  icon: Icon,
  tone,
  title,
  rows,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "green" | "violet" | "rose";
  title: string;
  rows: AlertRow[];
}) {
  if (rows.length === 0) return null;
  const TONE_BG = {
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    violet: "bg-violet-100 text-violet-700",
    rose: "bg-rose-100 text-rose-700",
  } as const;
  return (
    <section>
      <header className="mb-2 flex items-center gap-2">
        <span className={`rounded-md p-1 ${TONE_BG[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
          {title}
        </h3>
        <span className="ml-auto text-xs font-medium text-gray-400">
          {rows.length}
        </span>
      </header>
      <ul className="divide-y rounded-md border">
        {rows.slice(0, 5).map((r) => (
          <li key={r.id}>
            <Link
              href={`/receptions/${r.id}`}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">
                    {r.folio}
                  </span>
                  <span className="truncate font-medium">{r.primary}</span>
                </div>
                <p className="truncate text-xs text-gray-500">{r.secondary}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function daysAgo(date: Date): number {
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
