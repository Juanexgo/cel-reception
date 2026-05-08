"use client";

import { useActionState, useState } from "react";
import { createUserAction } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewUserDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Wrap the action so we can react to its result without a useEffect.
  const handleAction = async (
    prev: Awaited<ReturnType<typeof createUserAction>> | null,
    formData: FormData,
  ) => {
    const result = await createUserAction(prev, formData);
    if (result?.success) {
      setOpen(false);
      router.refresh();
    }
    return result;
  };

  const [state, formAction, isPending] = useActionState(handleAction, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Usuario</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre</Label>
            <Input id="user-name" name="name" required autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Contraseña</Label>
            <Input
              id="user-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select name="role" required defaultValue="EMPLOYEE">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                <SelectItem value="TECHNICIAN">Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state && !state.success && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {state.message}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creando..." : "Crear Usuario"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
