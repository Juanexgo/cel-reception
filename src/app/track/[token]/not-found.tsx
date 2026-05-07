import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function TrackNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <FileQuestion className="h-6 w-6 text-yellow-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Orden no encontrada</h2>
            <p className="mt-1 text-sm text-gray-500">
              Verifica el enlace o contacta al centro de servicio.
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Centro de Servicio Multimarcas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
