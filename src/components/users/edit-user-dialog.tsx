"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateUserAction } from "@/actions/user-actions";

type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export function EditUserDialog({ user }: { user: EditableUser }) {
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(user.isActive);
  const [role, setRole] = useState(user.role);
  const router = useRouter();

  const handleAction = async (
    prev: Awaited<ReturnType<typeof updateUserAction>> | null,
    formData: FormData,
  ) => {
    const result = await updateUserAction(prev, formData);
    if (result && "success" in result && result.success) {
      toast.success("Usuario actualizado");
      setOpen(false);
      router.refresh();
    } else if (result && "error" in result && result.error) {
      toast.error(result.error);
    }
    return result;
  };

  const [state, formAction, isPending] = useActionState(handleAction, null);

  // Re-sync local state to the latest row data on every open.
  function handleOpenChange(next: boolean) {
    if (next) {
      setIsActive(user.isActive);
      setRole(user.role);
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Editar ${user.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="role" value={role} />

          <div className="space-y-2">
            <Label htmlFor={`edit-name-${user.id}`}>Nombre</Label>
            <Input
              id={`edit-name-${user.id}`}
              name="name"
              defaultValue={user.name}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
            <Input
              id={`edit-email-${user.id}`}
              name="email"
              type="email"
              defaultValue={user.email}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select
              value={role}
              onValueChange={(value) => {
                if (typeof value === "string") setRole(value);
              }}
            >
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

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor={`edit-active-${user.id}`} className="cursor-pointer">
                Usuario activo
              </Label>
              <p className="text-xs text-muted-foreground">
                Los usuarios inactivos no pueden iniciar sesión.
              </p>
            </div>
            <Switch
              id={`edit-active-${user.id}`}
              name="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              value="true"
              uncheckedValue="false"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-password-${user.id}`}>
              Nueva contraseña{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id={`edit-password-${user.id}`}
              name="password"
              type="password"
              minLength={6}
              autoComplete="new-password"
              placeholder="Dejar en blanco para no cambiar"
            />
          </div>

          {state && "error" in state && state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {state.error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
