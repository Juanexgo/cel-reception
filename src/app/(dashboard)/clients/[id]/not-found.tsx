import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserX } from "lucide-react";

export default function ClientNotFound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <UserX className="h-6 w-6 text-yellow-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Cliente no encontrado</h2>
          <p className="mt-1 text-sm text-gray-500">
            El cliente que buscas no existe o fue eliminado.
          </p>
        </div>
        <Button asChild>
          <Link href="/clients">Volver al listado</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
