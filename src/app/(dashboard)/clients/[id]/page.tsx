import { getClientAction } from "@/actions/client-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { BRAND_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientAction(id);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
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
                  const statusLabel = STATUS_LABELS[r.status] ?? r.status;
                  const statusColor = STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.folio}</TableCell>
                      <TableCell>
                        {BRAND_LABELS[r.brand] ?? r.brand} {r.model}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{r.problem}</TableCell>
                      <TableCell>
                        <Badge className={statusColor}>{statusLabel}</Badge>
                      </TableCell>
                      <TableCell>{r.technician?.name || "—"}</TableCell>
                      <TableCell>
                        {new Date(r.createdAt).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/receptions/${r.id}`}>Ver</Link>
                        </Button>
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
