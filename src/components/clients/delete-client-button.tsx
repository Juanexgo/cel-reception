"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteClientAction } from "@/actions/client-actions";

/**
 * Per-row delete control for the clients table.
 *
 * Mirrors the existing DeleteReceptionButton so admins get a consistent
 * destructive-confirm flow across the app: trash icon → AlertDialog → toast.
 *
 * The control is rendered ONLY for admins (the parent page checks the
 * session role). The Server Action additionally re-checks `requireAdmin`
 * inside `safeAction`, so even if the button appears for a non-admin via
 * client-side tampering, the deletion is still blocked at the boundary.
 */
export function DeleteClientButton({
  clientId,
  clientName,
  receptionCount,
}: {
  clientId: string;
  clientName: string;
  /**
   * Pre-computed by the server. We use it to disable the button (with a
   * tooltip-via-title) when the client still owns receptions, instead of
   * sending a request that we know will be rejected.
   */
  receptionCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const blocked = receptionCount > 0;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Eliminar cliente ${clientName}`}
          title={
            blocked
              ? "No se puede eliminar: tiene recepciones asociadas"
              : "Eliminar cliente"
          }
          disabled={blocked}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Seguro que deseas eliminar a{" "}
            <span className="font-medium">{clientName}</span>? Esta acción no
            se puede deshacer y el cliente desaparecerá del listado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
