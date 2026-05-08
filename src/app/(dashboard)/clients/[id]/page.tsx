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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">
            {client.name}
          </h1>
          <p className="text-sm text-gray-500">Historial del cliente</p>
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
            <>
              {/* Mobile: tap-friendly card list, no horizontal scroll. */}
              <ul className="space-y-3 md:hidden">
                {client.receptions.map((r) => {
                  const statusLabel = STATUS_LABELS[r.status] ?? r.status;
                  const statusColor =
                    STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/receptions/${r.id}`}
                        className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3 hover:bg-muted/30"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold">
                              {r.folio}
                            </span>
                            <Badge className={`${statusColor} text-[11px]`}>
                              {statusLabel}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">
                            {BRAND_LABELS[r.brand] ?? r.brand} {r.model}
                          </p>
                          <p className="line-clamp-2 text-xs text-gray-500">
                            {r.problem}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString("es-MX")}
                            {r.technician?.name ? ` · ${r.technician.name}` : ""}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Folio</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Problema
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Técnico
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Fecha
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.receptions.map((r) => {
                      const statusLabel = STATUS_LABELS[r.status] ?? r.status;
                      const statusColor =
                        STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono font-medium">
                            {r.folio}
                          </TableCell>
                          <TableCell>
                            {BRAND_LABELS[r.brand] ?? r.brand} {r.model}
                          </TableCell>
                          <TableCell className="hidden max-w-xs truncate lg:table-cell">
                            {r.problem}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColor}>{statusLabel}</Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {r.technician?.name || "—"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {new Date(r.createdAt).toLocaleDateString("es-MX")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/receptions/${r.id}`}>Ver</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
