import Link from "next/link";
import {
  PlusCircle,
  PenSquare,
  RefreshCcw,
  Trash2,
  CheckCircle2,
  Activity,
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
 * Recent activity feed across all receptions. Reads from the AuditLog table
 * we added earlier, so we get who+what+when for free without a separate
 * write path.
 */

const ACTION_LABEL: Record<string, string> = {
  CREATE: "creó",
  UPDATE: "editó",
  STATUS_CHANGE: "cambió el estado de",
  DELIVER: "entregó",
  DELETE: "eliminó",
  DELETE_CLIENT: "eliminó al cliente",
};

const ACTION_ICON: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  CREATE: { icon: PlusCircle, tone: "bg-blue-100 text-blue-700" },
  UPDATE: { icon: PenSquare, tone: "bg-amber-100 text-amber-700" },
  STATUS_CHANGE: { icon: RefreshCcw, tone: "bg-violet-100 text-violet-700" },
  DELIVER: { icon: CheckCircle2, tone: "bg-green-100 text-green-700" },
  DELETE: { icon: Trash2, tone: "bg-rose-100 text-rose-700" },
  DELETE_CLIENT: { icon: Trash2, tone: "bg-rose-100 text-rose-700" },
};

export function ActivityFeedCard({
  entries,
}: {
  entries: ReceptionStats["recentAudits"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Actividad reciente
        </CardTitle>
        <CardDescription>
          Últimas acciones realizadas por el equipo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">
            Aún no hay actividad registrada.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => {
              const cfg = ACTION_ICON[e.action] ?? ACTION_ICON.CREATE;
              const Icon = cfg.icon;
              // Reception-scoped events get the folio link; client-scoped
              // ones (DELETE_CLIENT) link to /clients/<id> when the client
              // still exists, or render the snapshotted name otherwise.
              const receptionLabel = e.reception?.folio;
              const clientLabel = e.client?.name ??
                (typeof (e.metadata as Record<string, unknown> | null)?.clientName === "string"
                  ? ((e.metadata as Record<string, unknown>).clientName as string)
                  : null);
              return (
                <li key={e.id} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.tone}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="leading-tight">
                      <span className="font-medium">{e.userName}</span>{" "}
                      <span className="text-gray-500">
                        {ACTION_LABEL[e.action] ?? "actuó sobre"}
                      </span>{" "}
                      {e.receptionId ? (
                        <>
                          <Link
                            href={`/receptions/${e.receptionId}`}
                            className="font-mono text-xs hover:underline"
                          >
                            {receptionLabel ?? "—"}
                          </Link>
                          {e.reception ? (
                            <span className="text-gray-500">
                              {" "}
                              · {BRAND_LABELS[e.reception.brand] ?? e.reception.brand}{" "}
                              {e.reception.model}
                            </span>
                          ) : null}
                        </>
                      ) : e.clientId ? (
                        <Link
                          href={`/clients/${e.clientId}`}
                          className="font-medium hover:underline"
                        >
                          {clientLabel ?? "Cliente"}
                        </Link>
                      ) : (
                        <span className="text-gray-500">
                          {clientLabel ?? "—"}
                        </span>
                      )}
                    </p>
                    <ActivityMeta entry={e} />
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(e.createdAt).toLocaleString("es-MX")}
                    </p>
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

function ActivityMeta({
  entry,
}: {
  entry: ReceptionStats["recentAudits"][number];
}) {
  if (entry.action !== "STATUS_CHANGE") return null;
  const meta = entry.metadata as Record<string, unknown> | null;
  const from = typeof meta?.from === "string" ? meta.from : null;
  const to = typeof meta?.to === "string" ? meta.to : null;
  if (!from || !to) return null;
  return (
    <p className="mt-0.5 text-xs">
      <Badge className="bg-slate-100 text-slate-700">
        {STATUS_LABELS[from] ?? from}
      </Badge>
      <span className="mx-1 text-gray-400">→</span>
      <Badge className="bg-violet-100 text-violet-700">
        {STATUS_LABELS[to] ?? to}
      </Badge>
    </p>
  );
}
