import { getReceptionsAction } from "@/actions/reception-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Search,
  Printer,
  Eye,
  ChevronRight,
} from "lucide-react";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Recepciones</h1>
          <p className="text-sm text-gray-500">Gestión de órdenes de servicio</p>
        </div>
        <Button asChild className="sm:w-auto">
          <Link href="/receptions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Recepción
          </Link>
        </Button>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row sm:gap-3" role="search">
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
        <Button type="submit" className="sm:w-auto">
          Buscar
        </Button>
      </form>

      {receptions.length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <ClipboardList className="h-8 w-8 text-gray-300" />
            <p className="font-medium">No se encontraron recepciones</p>
            {search || statusFilter !== "ALL" ? (
              <p className="text-sm">Intenta limpiar los filtros.</p>
            ) : (
              <p className="text-sm">Crea la primera con el botón de arriba.</p>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: stacked card list. The table has 8 columns which is
              unusable on a phone — cards keep all the key info plus a
              tap target that fills the viewport width. */}
          <ul className="space-y-3 md:hidden">
            {receptions.map((r) => {
              const statusLabel = STATUS_LABELS[r.status] ?? r.status;
              const statusColor =
                STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
              return (
                <li key={r.id}>
                  <Card className="overflow-hidden">
                    <Link
                      href={`/receptions/${r.id}`}
                      className="flex items-start justify-between gap-3 p-4 hover:bg-muted/30"
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
                        <p className="truncate text-sm font-medium">
                          {r.client.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {(BRAND_LABELS[r.brand] ?? r.brand) + " " + r.model}
                          {" · "}
                          {r.client.phone}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString("es-MX")}
                          {r.technician?.name ? ` · ${r.technician.name}` : ""}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                    </Link>
                    <div className="flex border-t bg-muted/20">
                      <Link
                        href={`/receptions/${r.id}`}
                        className="flex flex-1 items-center justify-center gap-1 py-2 text-xs font-medium text-gray-700 hover:bg-muted/50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Link>
                      <Link
                        href={`/receptions/${r.id}/print`}
                        target="_blank"
                        className="flex flex-1 items-center justify-center gap-1 border-l py-2 text-xs font-medium text-gray-700 hover:bg-muted/50"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Imprimir
                      </Link>
                      {isAdmin && (
                        <div className="flex flex-1 items-center justify-center border-l">
                          <DeleteReceptionButton
                            receptionId={r.id}
                            folio={r.folio}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Desktop / tablet table. Columns hide progressively as width
              shrinks so the layout never has to scroll horizontally. */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden xl:table-cell">Técnico</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receptions.map((r) => {
                  const statusLabel = STATUS_LABELS[r.status] ?? r.status;
                  const statusColor =
                    STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">
                        {r.folio}
                      </TableCell>
                      <TableCell className="max-w-[20ch] truncate">
                        {r.client.name}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {r.client.phone}
                      </TableCell>
                      <TableCell className="max-w-[24ch] truncate">
                        {BRAND_LABELS[r.brand] ?? r.brand} {r.model}
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
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            variant="outline"
                            size="icon-sm"
                            aria-label="Ver"
                          >
                            <Link href={`/receptions/${r.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="icon-sm"
                            aria-label="Imprimir"
                          >
                            <Link
                              href={`/receptions/${r.id}/print`}
                              target="_blank"
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
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
