"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  const isUnauthorized = error.message?.toLowerCase().includes("unauthorized");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {isUnauthorized ? "Sesión expirada" : "Algo salió mal"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isUnauthorized
              ? "Vuelve a iniciar sesión para continuar."
              : "No pudimos cargar esta sección. Intenta de nuevo."}
          </p>
        </div>
        {isUnauthorized ? (
          <Button asChild>
            <a href="/login">Iniciar sesión</a>
          </Button>
        ) : (
          <Button onClick={() => reset()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
