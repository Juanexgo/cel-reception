import { getReceptionsAction } from "@/actions/reception-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ClipboardList, Plus, Search, Printer, Eye } from "lucide-react";
import { BRAND_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { DeleteReceptionButton } from "@/components/receptions/delete-reception-button";
import { getSession } from "@/lib/auth";

export default async function ReceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "ALL";
  const [receptions, session] = await Promise.all([
    getReceptionsAction(search, statusFilter),
    getSession(),
  ]);
  const isAdmin = session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recepciones</h1>
          <p className="text-gray-500">Gestión de órdenes de servicio</p>
        </div>
        <Button asChild>
          <Link href="/receptions/new">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Recepción
          </Link>
        </Button>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            placeholder="Buscar por folio, cliente o teléfono..."
            defaultValue={search}
            className="pl-10"
            aria-label="Buscar"
          />
        </div>
        <Select name="status" defaultValue={statusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Buscar</Button>
      </form>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <ClipboardList className="h-8 w-8 text-gray-300" />
                    <p className="font-medium">No se encontraron recepciones</p>
                    {search || statusFilter !== "ALL" ? (
                      <p className="text-sm">Intenta limpiar los filtros.</p>
                    ) : (
                      <p className="text-sm">Crea la primera con el botón de arriba.</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              receptions.map((r) => {
                const statusLabel = STATUS_LABELS[r.status] ?? r.status;
                const statusColor = STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">{r.folio}</TableCell>
                    <TableCell>{r.client.name}</TableCell>
                    <TableCell>{r.client.phone}</TableCell>
                    <TableCell>
                      {BRAND_LABELS[r.brand] ?? r.brand} {r.model}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor}>{statusLabel}</Badge>
                    </TableCell>
                    <TableCell>{r.technician?.name || "—"}</TableCell>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/receptions/${r.id}`} aria-label="Ver">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/receptions/${r.id}/print`}
                            target="_blank"
                            aria-label="Imprimir"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <DeleteReceptionButton
                            receptionId={r.id}
                            folio={r.folio}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
