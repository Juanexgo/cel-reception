"use client";

import { useActionState, useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Search } from "lucide-react";
import Link from "next/link";

const brands = [
  "APPLE", "SAMSUNG", "HUAWEI", "XIAOMI", "OPPO", "VIVO",
  "MOTOROLA", "LG", "GOOGLE", "ONEPLUS", "NOKIA", "SONY", "ZTE", "OTHER",
];

export function NewReceptionForm({ technicians }: { technicians: any[] }) {
  const [state, formAction, isPending] = useActionState(createReceptionAction, null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newClientState, newClientFormAction, newClientPending] = useActionState(
    createClientAction,
    null
  );

  useEffect(() => {
    if (newClientState && "success" in newClientState && newClientState.success && "clientId" in newClientState) {
      setSelectedClientId(newClientState.clientId);
      setShowNewClient(false);
    }
  }, [newClientState]);

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
        <Link href="/receptions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
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
                        setSelectedClientId(client.id);
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
            <input type="hidden" name="clientId" value={selectedClientId} />
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
                      <Label>Nombre</Label>
                      <Input name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input name="phone" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (opcional)</Label>
                      <Input name="email" type="email" />
                    </div>
                    <Button type="submit" disabled={newClientPending}>
                      Crear Cliente
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
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b.charAt(0) + b.slice(1).toLowerCase()}
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
              <Select name="technicianId">
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
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
