import Link from "next/link";
import { ClipboardList, Eye, Pencil, RefreshCcw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BRAND_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { ReceptionStats } from "@/repositories/reception-repository";

type Recent = ReceptionStats["recentReceptions"][number];

/**
 * "Recent receptions" table with quick actions.
 *
 * Quick actions are deep links to existing pages — we deliberately don't
 * inline a status-change form here to keep the dashboard a read surface and
 * avoid duplicating the validation logic that lives in /receptions/[id].
 */
export function RecentReceptionsCard({ items }: { items: Recent[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Recepciones recientes</CardTitle>
          <CardDescription>Las 5 más nuevas en el sistema</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/receptions">Ver todas</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">
                  Dispositivo
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => {
                const statusLabel = STATUS_LABELS[r.status] ?? r.status;
                const statusColor =
                  STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">
                      <Link
                        href={`/receptions/${r.id}`}
                        className="hover:underline"
                      >
                        {r.folio}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[14ch] truncate">
                      {r.client.name}
                    </TableCell>
                    <TableCell className="hidden text-sm text-gray-600 md:table-cell">
                      {(BRAND_LABELS[r.brand] ?? r.brand) + " " + r.model}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor}>{statusLabel}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-gray-500 lg:table-cell">
                      {new Date(r.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ver ${r.folio}`}
                        >
                          <Link href={`/receptions/${r.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ${r.folio}`}
                        >
                          {/* The detail page hosts edit + status forms in tabs. */}
                          <Link href={`/receptions/${r.id}#details`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Cambiar estado ${r.folio}`}
                        >
                          <Link href={`/receptions/${r.id}#status`}>
                            <RefreshCcw className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-gray-500">
      <ClipboardList className="h-8 w-8 text-gray-300" />
      <p className="font-medium">No hay recepciones aún</p>
      <p className="text-sm">
        Crea la primera desde la sección Recepciones.
      </p>
      <Button asChild size="sm" className="mt-2">
        <Link href="/receptions/new">Nueva recepción</Link>
      </Button>
    </div>
  );
}
