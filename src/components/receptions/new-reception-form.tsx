"use client";

import { useActionState, useState } from "react";
import { createReceptionAction } from "@/actions/reception-actions";
import { createClientAction, searchClientsAction } from "@/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { Technician } from "@/repositories/reception-repository";
import { BRAND_LABELS } from "@/lib/constants";

type ClientSummary = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

const brands = Object.entries(BRAND_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function NewReceptionForm({
  technicians,
}: {
  technicians: Technician[];
}) {
  const [state, formAction, isPending] = useActionState(createReceptionAction, null);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClientSummary[]>([]);

  // Wrap createClientAction so we can react to its result without a useEffect.
  const handleCreateClient = async (
    prev: Awaited<ReturnType<typeof createClientAction>> | null,
    formData: FormData,
  ) => {
    const result = await createClientAction(prev, formData);
    if (result && "success" in result && result.success) {
      setSelectedClient({
        id: result.clientId,
        name: (formData.get("name") as string) ?? "",
        phone: (formData.get("phone") as string) ?? "",
        email: (formData.get("email") as string) || null,
      });
      setSearchQuery((formData.get("name") as string) ?? "");
      setShowNewClient(false);
    }
    return result;
  };

  const [newClientState, newClientFormAction, newClientPending] = useActionState(
    handleCreateClient,
    null
  );

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchClientsAction(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/receptions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Recepción</h1>
          <p className="text-gray-500">Crear orden de servicio</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar cliente existente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, teléfono o email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                  {searchResults.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => {
                        setSelectedClient(client);
                        setSearchResults([]);
                        setSearchQuery(client.name);
                      }}
                    >
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedClient && (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-900/50 dark:bg-green-950/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">{selectedClient.name}</span>
                <span className="text-gray-500">· {selectedClient.phone}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setSearchQuery("");
                  }}
                  className="ml-auto text-xs text-gray-500 underline hover:text-gray-700"
                >
                  cambiar
                </button>
              </div>
            )}
            <input type="hidden" name="clientId" value={selectedClient?.id ?? ""} />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">O</span>
              <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Cliente</DialogTitle>
                  </DialogHeader>
                  <form action={newClientFormAction} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dlg-client-name">Nombre</Label>
                      <Input id="dlg-client-name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dlg-client-phone">Teléfono</Label>
                      <Input id="dlg-client-phone" name="phone" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dlg-client-email">Email (opcional)</Label>
                      <Input id="dlg-client-email" name="email" type="email" />
                    </div>
                    {newClientState && "error" in newClientState && newClientState.error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                        {newClientState.error}
                      </div>
                    )}
                    <Button type="submit" disabled={newClientPending} className="w-full">
                      {newClientPending ? "Creando..." : "Crear Cliente"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select name="brand" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input name="model" placeholder="Ej: iPhone 14 Pro" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input name="color" placeholder="Ej: Negro" required />
              </div>
              <div className="space-y-2">
                <Label>IMEI (opcional)</Label>
                <Input name="imei" placeholder="15 dígitos" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Problema / Falla</Label>
              <Textarea
                name="problem"
                placeholder="Describa el problema del dispositivo..."
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Accesorios Recibidos</Label>
              <Input name="accessories" placeholder="Ej: Cable, cargador, funda" defaultValue="Ninguno" />
            </div>
            <div className="space-y-2">
              <Label>Costo Estimado ($)</Label>
              <Input name="totalCost" type="number" step="0.01" defaultValue="0" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Técnico Asignado (opcional)</Label>
              <Select name="technicianId" defaultValue="none">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {state?.error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{state.error}</div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creando..." : "Crear Recepción"}
        </Button>
      </form>
    </div>
  );
}
