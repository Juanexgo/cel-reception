import { getPublicTrackingAction } from "@/actions/reception-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "Recibido", color: "bg-blue-100 text-blue-800" },
  DIAGNOSING: { label: "En diagnóstico", color: "bg-yellow-100 text-yellow-800" },
  WAITING_PARTS: { label: "Esperando piezas", color: "bg-orange-100 text-orange-800" },
  REPAIRING: { label: "En reparación", color: "bg-purple-100 text-purple-800" },
  READY: { label: "Listo para entrega", color: "bg-green-100 text-green-800" },
  DELIVERED: { label: "Entregado", color: "bg-slate-100 text-slate-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reception = await getPublicTrackingAction(token);

  if (!reception) notFound();

  const status = statusConfig[reception.status] || statusConfig.RECEIVED;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">Centro de Servicio Multimarcas</CardTitle>
          <p className="text-gray-500">Estado de tu reparación</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Folio</p>
            <p className="text-2xl font-bold font-mono">{reception.folio}</p>
          </div>

          <div className="text-center">
            <Badge className={`${status.color} text-base px-4 py-1`}>{status.label}</Badge>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Dispositivo</span>
              <span className="font-medium">
                {reception.brand} {reception.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Color</span>
              <span className="font-medium">{reception.color}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha de ingreso</span>
              <span className="font-medium">
                {new Date(reception.createdAt).toLocaleDateString("es-MX")}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Historial</h3>
            <div className="space-y-3">
              {reception.statusHistory.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        i === reception.statusHistory.length - 1 ? "bg-primary" : "bg-gray-300"
                      }`}
                    />
                    {i < reception.statusHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="pb-3">
                    <Badge
                      className={
                        statusConfig[entry.status]?.color || "bg-gray-100 text-gray-800"
                      }
                    >
                      {statusConfig[entry.status]?.label || entry.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(entry.createdAt).toLocaleString("es-MX")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-gray-400 pt-4 border-t">
            <p>Centro de Servicio Multimarcas</p>
            <p>Si tienes dudas, contacta al centro de servicio</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
