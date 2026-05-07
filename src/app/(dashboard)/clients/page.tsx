import { getClientsAction } from "@/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const clients = await getClientsAction();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-gray-500">Gestión de clientes</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <form className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            name="search"
            placeholder="Buscar por nombre, teléfono o email..."
            defaultValue={search}
            className="pl-10"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Recepciones</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.email || "—"}</TableCell>
                  <TableCell>{client._count?.receptions ?? 0}</TableCell>
                  <TableCell>
                    {new Date(client.createdAt).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/clients/${client.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
