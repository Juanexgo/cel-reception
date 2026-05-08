"use client";

import { useActionState } from "react";
import { findTrackingByFolioAction } from "@/actions/reception-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Smartphone, Search } from "lucide-react";

export default function TrackLookupPage() {
  const [state, formAction, isPending] = useActionState(
    findTrackingByFolioAction,
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Centro de Servicio Multimarcas</CardTitle>
          <CardDescription>
            Consulta el estado de tu reparación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folio">Folio</Label>
              <Input
                id="folio"
                name="folio"
                type="text"
                placeholder="REC-000001"
                autoComplete="off"
                autoCapitalize="characters"
                required
              />
              <p className="text-xs text-gray-500">
                Lo encuentras en tu orden de servicio o en el comprobante que te
                entregamos al recibir tu equipo.
              </p>
            </div>
            {state && !state.success && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                {state.message}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              <Search className="h-4 w-4 mr-2" />
              {isPending ? "Buscando..." : "Consultar estado"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>
              También puedes escanear el código QR que aparece en tu orden de
              servicio para entrar directamente al seguimiento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
