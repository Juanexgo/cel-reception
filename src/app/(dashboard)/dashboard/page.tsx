import { getDashboardStatsAction } from "@/actions/reception-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle, Truck, Wrench, Package, XCircle, DollarSign } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  RECEIVED: { label: "Recibido", icon: ClipboardList, color: "bg-blue-100 text-blue-800" },
  DIAGNOSING: { label: "Diagnóstico", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  WAITING_PARTS: { label: "Esperando piezas", icon: Package, color: "bg-orange-100 text-orange-800" },
  REPAIRING: { label: "En reparación", icon: Wrench, color: "bg-purple-100 text-purple-800" },
  READY: { label: "Listo", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  DELIVERED: { label: "Entregado", icon: Truck, color: "bg-slate-100 text-slate-800" },
  CANCELLED: { label: "Cancelado", icon: XCircle, color: "bg-red-100 text-red-800" },
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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = stats.statusCounts[key] || 0;
          return (
            <Card key={key}>
              <CardContent className="pt-4 text-center">
                <Icon className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                <div className="text-xl font-bold">{count}</div>
                <p className="text-xs text-gray-500">{config.label}</p>
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
            <p className="text-gray-500 text-center py-4">No hay recepciones aún</p>
          ) : (
            <div className="space-y-3">
              {stats.recentReceptions.map((r) => {
                const config = statusConfig[r.status] || statusConfig.RECEIVED;
                return (
                  <Link
                    key={r.id}
                    href={`/receptions/${r.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-medium">{r.folio}</span>
                      <div>
                        <p className="text-sm font-medium">{r.client.name}</p>
                        <p className="text-xs text-gray-500">
                          {r.brand} {r.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={config.color}>{config.label}</Badge>
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
