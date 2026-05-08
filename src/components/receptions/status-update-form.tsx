"use client";

import { useActionState } from "react";
import { updateStatusAction } from "@/actions/reception-actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";

const statuses = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function StatusUpdateForm({
  receptionId,
  currentStatus,
}: {
  receptionId: string;
  currentStatus: string;
}) {
  const handleAction = async (
    prev: Awaited<ReturnType<typeof updateStatusAction>> | null,
    formData: FormData,
  ) => {
    const result = await updateStatusAction(prev, formData);
    if (result?.success) {
      toast.success(result.message);
    } else if (result && !result.success) {
      toast.error(result.message);
    }
    return result;
  };

  const [state, formAction, isPending] = useActionState(handleAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="receptionId" value={receptionId} />
      <div className="space-y-2">
        <Label>Nuevo Estado</Label>
        <Select name="status" defaultValue={currentStatus}>
          <SelectTrigger className="w-full">
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
      {state && !state.success && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {state.message}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Actualizando..." : "Actualizar Estado"}
      </Button>
    </form>
  );
}
