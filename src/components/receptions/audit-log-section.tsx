import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PenSquare,
  PlusCircle,
  RefreshCcw,
  Trash2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants";
import type { AuditLogEntry } from "@/repositories/audit-repository";

/**
 * Read-only audit trail rendered inside the reception detail page.
 *
 * Server Component — receives the already-fetched entries as props instead
 * of doing its own data fetching, so we don't get a waterfall on render.
 */

// `getAuditLog(receptionId)` only returns reception-scoped rows, so in
// practice DELETE_CLIENT never appears here — but TypeScript still needs a
// complete map of every AuditAction enum value.
const ACTION_LABEL: Record<AuditLogEntry["action"], string> = {
  CREATE: "Recepción creada",
  UPDATE: "Recepción editada",
  STATUS_CHANGE: "Cambio de estado",
  DELIVER: "Equipo entregado",
  DELETE: "Recepción eliminada",
  DELETE_CLIENT: "Cliente eliminado",
};

const ACTION_BADGE: Record<AuditLogEntry["action"], string> = {
  CREATE: "bg-blue-100 text-blue-800",
  UPDATE: "bg-amber-100 text-amber-800",
  STATUS_CHANGE: "bg-purple-100 text-purple-800",
  DELIVER: "bg-green-100 text-green-800",
  DELETE: "bg-red-100 text-red-800",
  DELETE_CLIENT: "bg-red-100 text-red-800",
};

const ACTION_ICON: Record<AuditLogEntry["action"], React.ComponentType<{ className?: string }>> = {
  CREATE: PlusCircle,
  UPDATE: PenSquare,
  STATUS_CHANGE: RefreshCcw,
  DELIVER: CheckCircle2,
  DELETE: Trash2,
  DELETE_CLIENT: Trash2,
};

export function AuditLogSection({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Auditoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no hay actividad registrada para esta recepción.
          </p>
        ) : (
          <ul className="space-y-4">
            {entries.map((e) => {
              const Icon = ACTION_ICON[e.action];
              return (
                <li key={e.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/30">
                    <Icon className="h-4 w-4 text-gray-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={ACTION_BADGE[e.action]}>
                        {ACTION_LABEL[e.action]}
                      </Badge>
                      <span className="text-sm font-medium">{e.userName}</span>
                      <span className="text-xs text-gray-400">
                        ({e.userEmail})
                      </span>
                    </div>
                    <AuditMetadataLine entry={e} />
                    <p className="mt-1 text-xs text-gray-400">
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

/** One-liner summary of the per-action metadata. */
function AuditMetadataLine({ entry }: { entry: AuditLogEntry }) {
  const meta = entry.metadata as Record<string, unknown> | null;
  if (!meta) return null;

  if (entry.action === "CREATE") {
    const folio = typeof meta.folio === "string" ? meta.folio : null;
    const brand = typeof meta.brand === "string" ? meta.brand : null;
    const model = typeof meta.model === "string" ? meta.model : null;
    return (
      <p className="mt-0.5 text-sm text-gray-600">
        {folio} · {brand} {model}
      </p>
    );
  }

  if (entry.action === "STATUS_CHANGE") {
    const from = typeof meta.from === "string" ? meta.from : "?";
    const to = typeof meta.to === "string" ? meta.to : "?";
    const notes = typeof meta.notes === "string" ? meta.notes : null;
    return (
      <p className="mt-0.5 text-sm text-gray-600">
        <span className="font-medium">{STATUS_LABELS[from] ?? from}</span>
        {" → "}
        <span className="font-medium">{STATUS_LABELS[to] ?? to}</span>
        {notes ? <span className="text-gray-500"> · {notes}</span> : null}
      </p>
    );
  }

  if (entry.action === "UPDATE") {
    const fields = Array.isArray(meta.changedFields)
      ? (meta.changedFields as unknown[])
          .filter((s): s is string => typeof s === "string")
          .join(", ")
      : "";
    return (
      <p className="mt-0.5 text-sm text-gray-600">
        Campos modificados: <span className="font-mono text-xs">{fields}</span>
      </p>
    );
  }

  if (entry.action === "DELIVER") {
    const notes = typeof meta.notes === "string" ? meta.notes : null;
    return notes ? (
      <p className="mt-0.5 text-sm text-gray-600">{notes}</p>
    ) : null;
  }

  return null;
}
