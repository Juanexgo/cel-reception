import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function ReceptionNotFound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <FileQuestion className="h-6 w-6 text-yellow-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Recepción no encontrada</h2>
          <p className="mt-1 text-sm text-gray-500">
            La recepción que buscas no existe o fue eliminada.
          </p>
        </div>
        <Button asChild>
          <Link href="/receptions">Volver al listado</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
