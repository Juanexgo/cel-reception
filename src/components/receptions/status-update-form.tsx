"use client";

import { useActionState } from "react";
import { updateStatusAction } from "@/actions/reception-actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const statuses = [
  { value: "RECEIVED", label: "Recibido" },
  { value: "DIAGNOSING", label: "En diagnóstico" },
  { value: "WAITING_PARTS", label: "Esperando piezas" },
  { value: "REPAIRING", label: "En reparación" },
  { value: "READY", label: "Listo para entrega" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export function StatusUpdateForm({ receptionId, currentStatus }: { receptionId: string; currentStatus: string }) {
  const [state, formAction, isPending] = useActionState(updateStatusAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="receptionId" value={receptionId} />
      <div className="space-y-2">
        <Label>Nuevo Estado</Label>
        <Select name="status" defaultValue={currentStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notas (opcional)</Label>
        <Textarea name="notes" placeholder="Agregar nota..." rows={2} />
      </div>
      {state?.error && <div className="text-sm text-red-500">{state.error}</div>}
      {state?.success && <div className="text-sm text-green-600">Estado actualizado</div>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Actualizando..." : "Actualizar Estado"}
      </Button>
    </form>
  );
}
