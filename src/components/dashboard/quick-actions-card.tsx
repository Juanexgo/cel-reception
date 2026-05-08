import Link from "next/link";
import { Plus, Search, RefreshCcw, Truck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Tile of fixed shortcuts. The "Update Status" and "Deliver Device" actions
 * deep-link to the receptions list pre-filtered to the relevant statuses,
 * because both operations require picking a specific reception first.
 */
export function QuickActionsCard() {
  const actions = [
    {
      href: "/receptions/new",
      label: "Nueva recepción",
      hint: "Crea una orden de servicio",
      icon: Plus,
      tone: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    },
    {
      href: "/receptions",
      label: "Buscar dispositivo",
      hint: "Por folio, cliente o teléfono",
      icon: Search,
      tone: "bg-slate-50 text-slate-700 hover:bg-slate-100",
    },
    {
      href: "/receptions?status=REPAIRING",
      label: "Cambiar estado",
      hint: "Reparaciones en curso",
      icon: RefreshCcw,
      tone: "bg-violet-50 text-violet-700 hover:bg-violet-100",
    },
    {
      href: "/receptions?status=READY",
      label: "Entregar equipo",
      hint: "Listas para recoger",
      icon: Truck,
      tone: "bg-green-50 text-green-700 hover:bg-green-100",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesos rápidos</CardTitle>
        <CardDescription>Tareas frecuentes del día a día</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className={cn(
                "group flex flex-col gap-2 rounded-lg border p-3 transition-colors",
                a.tone
              )}
            >
              <Icon className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold leading-tight">{a.label}</p>
                <p className="text-xs leading-tight opacity-80">{a.hint}</p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
