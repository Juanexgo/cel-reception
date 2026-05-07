import { getClientAction } from "@/actions/client-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "Recibido", color: "bg-blue-100 text-blue-800" },
  DIAGNOSING: { label: "Diagnóstico", color: "bg-yellow-100 text-yellow-800" },
  WAITING_PARTS: { label: "Esperando piezas", color: "bg-orange-100 text-orange-800" },
  REPAIRING: { label: "En reparación", color: "bg-purple-100 text-purple-800" },
  READY: { label: "Listo", color: "bg-green-100 text-green-800" },
  DELIVERED: { label: "Entregado", color: "bg-slate-100 text-slate-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientAction(id);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-gray-500">Historial del cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{client.email || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Total de recepciones</p>
              <p className="text-2xl font-bold">{client.receptions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Recepciones</CardTitle>
        </CardHeader>
        <CardContent>
          {client.receptions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay recepciones</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Problema</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.receptions.map((r) => {
                  const config = statusConfig[r.status] || statusConfig.RECEIVED;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.folio}</TableCell>
                      <TableCell>
                        {r.brand} {r.model}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{r.problem}</TableCell>
                      <TableCell>
                        <Badge className={config.color}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>{(r as any).technician?.name || "—"}</TableCell>
                      <TableCell>
                        {new Date(r.createdAt).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell>
                        <Link href={`/receptions/${r.id}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
