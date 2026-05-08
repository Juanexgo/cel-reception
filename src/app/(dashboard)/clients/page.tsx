import { getClientsAction } from "@/actions/client-actions";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ChevronRight, Eye, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { DeleteClientButton } from "@/components/clients/delete-client-button";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const [clients, session] = await Promise.all([
    getClientsAction(),
    getSession(),
  ]);
  const isAdmin = session?.role === "ADMIN";

  const filtered = search
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
      )
    : clients;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Clientes</h1>
          <p className="text-sm text-gray-500">Gestión de clientes</p>
        </div>
        <Button asChild className="sm:w-auto">
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            placeholder="Buscar por nombre, teléfono o email..."
            defaultValue={search}
            className="pl-10"
          />
        </div>
        <Button type="submit" className="sm:w-auto">
          Buscar
        </Button>
      </form>

      {filtered.length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Users className="h-8 w-8 text-gray-300" />
            <p className="font-medium">No se encontraron clientes</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile cards. Tap surface fills the row; secondary actions are
              isolated in a footer strip so the whole row stays a primary
              "view client" target. */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((client) => {
              const receptionCount = client._count?.receptions ?? 0;
              return (
                <li key={client.id}>
                  <Card className="overflow-hidden">
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-start justify-between gap-3 p-4 hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-sm font-semibold">
                          {client.name}
                        </p>
                        <p className="truncate text-xs text-gray-600">
                          {client.phone}
                          {client.email ? ` · ${client.email}` : ""}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {receptionCount} recepción{receptionCount === 1 ? "" : "es"} ·{" "}
                          {new Date(client.createdAt).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                    </Link>
                    {isAdmin ? (
                      <div className="flex border-t bg-muted/20">
                        <Link
                          href={`/clients/${client.id}`}
                          className="flex flex-1 items-center justify-center gap-1 py-2 text-xs font-medium text-gray-700 hover:bg-muted/50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </Link>
                        <div className="flex flex-1 items-center justify-center border-l">
                          <DeleteClientButton
                            clientId={client.id}
                            clientName={client.name}
                            receptionCount={receptionCount}
                          />
                        </div>
                      </div>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>

          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Recepciones</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="max-w-[24ch] truncate font-medium">
                      {client.name}
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="hidden max-w-[24ch] truncate lg:table-cell">
                      {client.email || "—"}
                    </TableCell>
                    <TableCell>{client._count?.receptions ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {new Date(client.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ver ${client.name}`}
                          title="Ver cliente"
                        >
                          <Link href={`/clients/${client.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <DeleteClientButton
                            clientId={client.id}
                            clientName={client.name}
                            receptionCount={client._count?.receptions ?? 0}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
