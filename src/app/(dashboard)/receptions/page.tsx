import { getReceptionsAction } from "@/actions/reception-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Search, Printer, Eye } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "Recibido", color: "bg-blue-100 text-blue-800" },
  DIAGNOSING: { label: "Diagnóstico", color: "bg-yellow-100 text-yellow-800" },
  WAITING_PARTS: { label: "Esperando piezas", color: "bg-orange-100 text-orange-800" },
  REPAIRING: { label: "En reparación", color: "bg-purple-100 text-purple-800" },
  READY: { label: "Listo", color: "bg-green-100 text-green-800" },
  DELIVERED: { label: "Entregado", color: "bg-slate-100 text-slate-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default async function ReceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "ALL";
  const receptions = await getReceptionsAction(search, statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recepciones</h1>
          <p className="text-gray-500">Gestión de órdenes de servicio</p>
        </div>
        <Link href="/receptions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Recepción
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <form className="flex-1 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              name="search"
              placeholder="Buscar por folio, cliente o teléfono..."
              defaultValue={search}
              className="pl-10"
            />
          </div>
          <Select name="status" defaultValue={statusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="RECEIVED">Recibido</SelectItem>
              <SelectItem value="DIAGNOSING">Diagnóstico</SelectItem>
              <SelectItem value="WAITING_PARTS">Esperando piezas</SelectItem>
              <SelectItem value="REPAIRING">En reparación</SelectItem>
              <SelectItem value="READY">Listo</SelectItem>
              <SelectItem value="DELIVERED">Entregado</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">Buscar</Button>
        </form>
      </div>

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
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No se encontraron recepciones
                </TableCell>
              </TableRow>
            ) : (
              receptions.map((r) => {
                const config = statusConfig[r.status] || statusConfig.RECEIVED;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">{r.folio}</TableCell>
                    <TableCell>{r.client.name}</TableCell>
                    <TableCell>{r.client.phone}</TableCell>
                    <TableCell>
                      {r.brand} {r.model}
                    </TableCell>
                    <TableCell>
                      <Badge className={config.color}>{config.label}</Badge>
                    </TableCell>
                    <TableCell>{r.technician?.name || "—"}</TableCell>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/receptions/${r.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/receptions/${r.id}/print`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </Link>
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
