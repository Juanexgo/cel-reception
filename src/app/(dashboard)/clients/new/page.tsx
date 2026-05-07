"use client";

import { useActionState } from "react";
import { createClientAction } from "@/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewClientPage() {
  const router = useRouter();

  const handleAction = async (
    prev: Awaited<ReturnType<typeof createClientAction>> | null,
    formData: FormData,
  ) => {
    const result = await createClientAction(prev, formData);
    if (result && "success" in result && result.success) {
      router.push("/clients");
      router.refresh();
    }
    return result;
  };

  const [state, formAction, isPending] = useActionState(handleAction, null);

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Cliente</h1>
          <p className="text-gray-500">Registrar un nuevo cliente</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input name="name" required placeholder="Nombre completo" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input name="phone" required placeholder="10 dígitos" />
            </div>
            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input name="email" type="email" placeholder="correo@ejemplo.com" />
            </div>
            {state && "error" in state && state.error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {state.error}
              </div>
            )}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creando..." : "Crear Cliente"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
