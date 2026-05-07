import { getDashboardStatsAction } from "@/actions/reception-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  Truck,
  Wrench,
  Package,
  XCircle,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { BRAND_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

const statusIcons: Record<string, LucideIcon> = {
  RECEIVED: ClipboardList,
  DIAGNOSING: Clock,
  WAITING_PARTS: Package,
  REPAIRING: Wrench,
  READY: CheckCircle,
  DELIVERED: Truck,
  CANCELLED: XCircle,
};

export default async function DashboardPage() {
  const stats = await getDashboardStatsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Resumen del centro de servicio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Recepciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recepciones Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">{stats.paymentCount} pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(stats.statusCounts["RECEIVED"] || 0) +
                (stats.statusCounts["DIAGNOSING"] || 0) +
                (stats.statusCounts["WAITING_PARTS"] || 0) +
                (stats.statusCounts["REPAIRING"] || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const Icon = statusIcons[key] ?? ClipboardList;
          const count = stats.statusCounts[key] || 0;
          return (
            <Card key={key}>
              <CardContent className="pt-4 text-center">
                <Icon className="mx-auto mb-2 h-5 w-5 text-gray-400" />
                <div className="text-xl font-bold">{count}</div>
                <p className="text-xs text-gray-500">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recepciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentReceptions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-gray-500">
              <ClipboardList className="h-8 w-8 text-gray-300" />
              <p className="font-medium">No hay recepciones aún</p>
              <p className="text-sm">Crea la primera desde la sección Recepciones.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentReceptions.map((r) => {
                const statusLabel = STATUS_LABELS[r.status] ?? r.status;
                const statusColor = STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
                return (
                  <Link
                    key={r.id}
                    href={`/receptions/${r.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-medium">{r.folio}</span>
                      <div>
                        <p className="text-sm font-medium">{r.client.name}</p>
                        <p className="text-xs text-gray-500">
                          {BRAND_LABELS[r.brand] ?? r.brand} {r.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColor}>{statusLabel}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
